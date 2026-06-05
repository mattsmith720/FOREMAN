import Foundation
import MWDATCamera
import MWDATCore
import UIKit

@MainActor
final class StreamViewModel: ObservableObject {
    @Published var previewImage: UIImage?
    @Published var coaching: CoachingResponse?
    @Published var streamStateLabel = "Stopped"
    @Published var errorMessage: String?

    private let backend = BackendClient.shared
    private var deviceSession: DeviceSession?
    private var stream: Stream?
    private var stateListenerToken: (any AnyListenerToken)?
    private var frameListenerToken: (any AnyListenerToken)?
    private var sessionId: String?
    private var lastSampleAt = Date.distantPast
    private var isAnalysing = false
    private let sampleInterval: TimeInterval = 4

    func startJob() async {
        errorMessage = nil
        coaching = nil
        previewImage = nil

        do {
            let session = try await backend.startSession()
            sessionId = session.id
            try await startStream()
        } catch {
            errorMessage = error.localizedDescription
            streamStateLabel = "Error"
        }
    }

    func stopJob() async -> (SessionRow, SessionCounts)? {
        await stopStream()

        guard let sessionId else { return nil }

        do {
            let result = try await backend.stopSession(sessionId: sessionId)
            self.sessionId = nil
            coaching = nil
            previewImage = nil
            streamStateLabel = "Stopped"
            return result
        } catch {
            errorMessage = error.localizedDescription
            streamStateLabel = "Error"
            return nil
        }
    }

    private func startStream() async throws {
        let wearables = Wearables.shared
        let deviceSelector = AutoDeviceSelector(wearables: wearables)
        let session = try wearables.createSession(deviceSelector: deviceSelector)
        try session.start()
        deviceSession = session

        let config = StreamConfiguration(
            videoCodec: .raw,
            resolution: .low,
            frameRate: 24
        )

        guard let cameraStream = try session.addStream(config: config) else {
            throw BackendClientError.badResponse("Could not create camera stream.")
        }

        stream = cameraStream

        stateListenerToken = cameraStream.statePublisher.listen { [weak self] state in
            Task { @MainActor in
                self?.streamStateLabel = String(describing: state)
            }
        }

        frameListenerToken = cameraStream.videoFramePublisher.listen { [weak self] frame in
            guard let self else { return }
            guard let image = frame.makeUIImage() else { return }

            Task { @MainActor in
                self.previewImage = image
                await self.maybeAnalyseFrame(image)
            }
        }

        await cameraStream.start()
    }

    private func stopStream() async {
        if let stream {
            await stream.stop()
        }
        deviceSession?.stop()

        stream = nil
        deviceSession = nil
        stateListenerToken = nil
        frameListenerToken = nil
    }

    private func maybeAnalyseFrame(_ image: UIImage) async {
        guard let sessionId else { return }
        guard !isAnalysing else { return }

        let now = Date()
        guard now.timeIntervalSince(lastSampleAt) >= sampleInterval else { return }

        lastSampleAt = now
        isAnalysing = true
        streamStateLabel = "Analysing"

        defer { isAnalysing = false }

        do {
            coaching = try await backend.analyseFrame(
                image: image,
                sessionId: sessionId
            )
            streamStateLabel = "Streaming"
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
            streamStateLabel = "Error"
        }
    }
}
