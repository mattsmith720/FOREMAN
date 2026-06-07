import Foundation
import UIKit

enum BackendClientError: LocalizedError {
    case invalidURL
    case badResponse(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Backend URL is not configured."
        case .badResponse(let message):
            return message
        }
    }
}

final class BackendClient {
    static let shared = BackendClient()

    private let decoder = JSONDecoder()
    private var sessionToken: String?

    private var baseURL: URL? {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "BACKEND_API_URL") as? String,
            let url = URL(string: value)
        else {
            return nil
        }
        return url
    }

    /// FOREMAN_API_KEY from the xcconfig/Info.plist — required by the production
    /// backend on every non-public route. Empty in pure mock/dev setups.
    private var apiKey: String? {
        let value = Bundle.main.object(forInfoDictionaryKey: "FOREMAN_API_KEY") as? String
        let trimmed = value?.trimmingCharacters(in: .whitespacesAndNewlines)
        return (trimmed?.isEmpty == false) ? trimmed : nil
    }

    private func makeRequest(path: String, method: String) throws -> URLRequest {
        guard let baseURL else { throw BackendClientError.invalidURL }
        let url = baseURL.appendingPathComponent(
            path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        )
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let apiKey {
            request.setValue(apiKey, forHTTPHeaderField: "x-foreman-api-key")
        }
        if let sessionToken {
            request.setValue(sessionToken, forHTTPHeaderField: "x-session-token")
        }
        return request
    }

    func startSession(
        jobType: String,
        worker: String?,
        consentAt: String?
    ) async throws -> SessionRow {
        // Drop any stale token from a prior job before issuing a fresh one.
        sessionToken = nil
        var request = try makeRequest(path: "/sessions/start", method: "POST")
        var body: [String: Any] = ["jobType": jobType]
        if let worker, !worker.isEmpty { body["worker"] = worker }
        if let consentAt { body["consentAt"] = consentAt }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct StartResponse: Decodable {
            let session: SessionRow
            let token: String?
        }
        let decoded = try decoder.decode(StartResponse.self, from: data)
        // Capture the HMAC session token so analyse/stop authenticate.
        sessionToken = decoded.token
        return decoded.session
    }

    func analyseFrame(
        image: UIImage,
        sessionId: String,
        jobType: String,
        recentTranscript: [String] = [],
        captureMeta: CaptureMeta? = nil
    ) async throws -> CoachingResponse {
        guard let jpeg = image.jpegData(compressionQuality: 0.7) else {
            throw BackendClientError.badResponse("Could not encode frame.")
        }
        let imagePayload = "data:image/jpeg;base64,\(jpeg.base64EncodedString())"

        var body: [String: Any] = [
            "image": imagePayload,
            "sessionId": sessionId,
            "context": ["jobType": jobType],
        ]
        if !recentTranscript.isEmpty {
            body["recentTranscript"] = recentTranscript
        }
        if let captureMeta,
           let metaData = try? JSONEncoder().encode(captureMeta),
           let metaObject = try? JSONSerialization.jsonObject(with: metaData) {
            body["captureMeta"] = metaObject
        }

        var request = try makeRequest(path: "/analyse", method: "POST")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct AnalyseResponse: Decodable {
            let coaching: CoachingResponse
        }
        return try decoder.decode(AnalyseResponse.self, from: data).coaching
    }

    /// Transcribe an audio chunk (m4a/aac) for a session. Matches the web
    /// client + backend contract: a base64 data-URL in JSON, not multipart.
    func transcribe(
        audio: Data,
        mimeType: String = "audio/mp4",
        sessionId: String,
        speaker: String = "worker"
    ) async throws -> String {
        let dataUrl = "data:\(mimeType);base64,\(audio.base64EncodedString())"
        var request = try makeRequest(path: "/transcribe", method: "POST")
        let body: [String: Any] = [
            "audio": dataUrl,
            "sessionId": sessionId,
            "speaker": speaker,
        ]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct TranscribeResponse: Decodable { let text: String? }
        let decoded = try? decoder.decode(TranscribeResponse.self, from: data)
        return decoded?.text?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
    }

    func stopSession(sessionId: String) async throws -> (SessionRow, SessionCounts) {
        let request = try makeRequest(
            path: "/sessions/\(sessionId)/stop",
            method: "POST"
        )

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct StopResponse: Decodable {
            let session: SessionRow
            let stored: SessionCounts
        }
        let decoded = try decoder.decode(StopResponse.self, from: data)
        // Keep the session token alive after stop so post-job review can read the
        // session and confirm labels. Cleared when the worker starts a new job.
        return (decoded.session, decoded.stored)
    }

    /// Fetch a stopped session for post-job review (requires the session token from start).
    func getSession(sessionId: String) async throws -> (SessionRow, SessionCounts) {
        let request = try makeRequest(path: "/sessions/\(sessionId)", method: "GET")

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct GetResponse: Decodable {
            let session: SessionRow
            let stored: SessionCounts
        }
        let decoded = try decoder.decode(GetResponse.self, from: data)
        return (decoded.session, decoded.stored)
    }

    private func validate(response: URLResponse, data: Data) throws {
        guard let http = response as? HTTPURLResponse else {
            throw BackendClientError.badResponse("No HTTP response.")
        }

        guard (200 ... 299).contains(http.statusCode) else {
            if
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let error = json["error"] as? String
            {
                throw BackendClientError.badResponse(error)
            }
            throw BackendClientError.badResponse("Request failed (\(http.statusCode)).")
        }
    }
}
