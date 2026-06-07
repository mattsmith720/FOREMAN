import AVFoundation

/// Captures microphone audio in ~4s AAC/m4a chunks and hands each finalized
/// chunk to `onChunk` for transcription (POST /transcribe). This mirrors the web
/// client's PhoneAudioSource so pitch coaching works on the native path too.
///
/// Today it uses the **phone microphone**. On real Meta glasses, swap the capture
/// here for the DAT microphone stream — the analyse/transcribe pipeline downstream
/// is identical (see the Meta MCP `search_dat_docs` for the current mic API).
///
/// Build/run is Mac-only (Xcode); not compiled in CI.
@MainActor
final class MicCaptureService: NSObject {
    /// Called with a finalized m4a chunk (~`chunkInterval` seconds of audio).
    var onChunk: ((Data) -> Void)?

    private var recorder: AVAudioRecorder?
    private var chunkTimer: Timer?
    private var fileURL: URL?
    private let chunkInterval: TimeInterval = 4

    /// Begin chunked capture. Throws if the mic/session can't start; the caller
    /// keeps vision coaching running even if this fails.
    func start() throws {
        let session = AVAudioSession.sharedInstance()
        try session.setCategory(
            .playAndRecord,
            mode: .spokenAudio,
            options: [.duckOthers, .defaultToSpeaker, .allowBluetooth]
        )
        try session.setActive(true)

        try beginSegment()
        chunkTimer = Timer.scheduledTimer(
            withTimeInterval: chunkInterval,
            repeats: true
        ) { [weak self] _ in
            Task { @MainActor in self?.rotateSegment() }
        }
    }

    /// Stop capture, flush the final chunk, and hand the session back to
    /// playback-only so the mic in-use indicator clears while post-job TTS plays.
    func stop() {
        chunkTimer?.invalidate()
        chunkTimer = nil
        flushCurrentSegment()
        recorder = nil
        fileURL = nil
        try? AVAudioSession.sharedInstance().setCategory(
            .playback,
            options: [.duckOthers, .mixWithOthers]
        )
    }

    private func beginSegment() throws {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("foreman-\(UUID().uuidString).m4a")
        let settings: [String: Any] = [
            AVFormatIDKey: Int(kAudioFormatMPEG4AAC),
            AVSampleRateKey: 16_000,
            AVNumberOfChannelsKey: 1,
            AVEncoderAudioQualityKey: AVAudioQuality.medium.rawValue,
        ]
        let newRecorder = try AVAudioRecorder(url: url, settings: settings)
        newRecorder.record()
        recorder = newRecorder
        fileURL = url
    }

    private func rotateSegment() {
        flushCurrentSegment()
        try? beginSegment()
    }

    private func flushCurrentSegment() {
        guard let recorder, let url = fileURL else { return }
        recorder.stop()
        self.recorder = nil
        self.fileURL = nil
        if let data = try? Data(contentsOf: url), data.count > 1_000 {
            onChunk?(data)
        }
        try? FileManager.default.removeItem(at: url)
    }
}
