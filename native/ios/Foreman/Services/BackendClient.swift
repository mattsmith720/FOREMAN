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
    private let encoder = JSONEncoder()

    private var baseURL: URL? {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "BACKEND_API_URL") as? String,
            let url = URL(string: value)
        else {
            return nil
        }
        return url
    }

    func startSession() async throws -> SessionRow {
        try await post(
            path: "/sessions/start",
            body: [
                "jobType": "solar_install",
                "notes": "Native iOS mock glasses job",
            ],
            responseKey: "session"
        )
    }

    func analyseFrame(
        image: UIImage,
        sessionId: String,
        recentTranscript: [String] = []
    ) async throws -> CoachingResponse {
        guard let baseURL else { throw BackendClientError.invalidURL }

        guard
            let jpeg = image.jpegData(compressionQuality: 0.8)
        else {
            throw BackendClientError.badResponse("Could not encode frame.")
        }

        let base64 = jpeg.base64EncodedString()
        let imagePayload = "data:image/jpeg;base64,\(base64)"

        var body: [String: Any] = [
            "image": imagePayload,
            "sessionId": sessionId,
            "context": [
                "jobType": "solar_install",
            ],
        ]

        if !recentTranscript.isEmpty {
            body["recentTranscript"] = recentTranscript
        }

        let url = baseURL.appendingPathComponent("analyse")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct AnalyseResponse: Decodable {
            let coaching: CoachingResponse
        }

        return try decoder.decode(AnalyseResponse.self, from: data).coaching
    }

    func stopSession(sessionId: String) async throws -> (SessionRow, SessionCounts) {
        guard let baseURL else { throw BackendClientError.invalidURL }

        let url = baseURL.appendingPathComponent("sessions/\(sessionId)/stop")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        struct StopResponse: Decodable {
            let session: SessionRow
            let stored: SessionCounts
        }

        let decoded = try decoder.decode(StopResponse.self, from: data)
        return (decoded.session, decoded.stored)
    }

    private func post<T: Decodable>(
        path: String,
        body: [String: Any],
        responseKey: String
    ) async throws -> T {
        guard let baseURL else { throw BackendClientError.invalidURL }

        let url = baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        try validate(response: response, data: data)

        guard
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let payload = json[responseKey]
        else {
            throw BackendClientError.badResponse("Missing \(responseKey) in response.")
        }

        let payloadData = try JSONSerialization.data(withJSONObject: payload)
        return try decoder.decode(T.self, from: payloadData)
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
