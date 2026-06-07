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

    var jobType: String = "solar_install"
    var worker: String?
    var consentAt: String?
    private var lastSpokenCue = ""

    func startJob() async {
        errorMessage = nil
        coaching = nil
        previewImage = nil

        do {
            lastSpokenCue = ""
            let session = try await backend.startSession(
                jobType: jobType,
                worker: worker,
                consentAt: consentAt
            )
            sessionId = session.id
            try await startStream()
            VoiceCoach.shared.speak(
                "Foreman is recording and coaching now. I'll call out anything important.",
                force: true
            )
        } catch {
            errorMessage = error.localizedDescription
            streamStateLabel = "Error"
        }
    }

    func stopJob() async -> (SessionRow, SessionCounts)? {
        await stopStream()
        VoiceCoach.shared.speak("Recording off.", force: true)
        lastSpokenCue = ""

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
            let result = try await backend.analyseFrame(
                image: image,
                sessionId: sessionId,
                jobType: jobType
            )
            coaching = result
            speakCue(result)
            streamStateLabel = "Streaming"
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
            streamStateLabel = "Error"
        }
    }

    private func speakCue(_ coaching: CoachingResponse) {
        if let cue = coaching.spokenCue {
            if cue.speak, cue.say != lastSpokenCue {
                lastSpokenCue = cue.say
                VoiceCoach.shared.speak(cue.say)
            }
            return
        }
        // Fallback: severity-first from flags, then the next step.
        let line =
            coaching.installQualityFlags.first(where: { $0.severity == .critical })?.message
            ?? coaching.installQualityFlags.first(where: { $0.severity == .warning })?.message
            ?? coaching.nextSteps.first
        if let line, line != lastSpokenCue {
            lastSpokenCue = line
            VoiceCoach.shared.speak(line)
        }
    }
}
