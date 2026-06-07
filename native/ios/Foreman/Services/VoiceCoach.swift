import AVFoundation

/// Speaks coaching aloud through the phone / glasses speaker. Glasses have no
/// screen, so voice is the primary coaching channel for the hands-free path.
@MainActor
final class VoiceCoach {
    static let shared = VoiceCoach()

    private let synthesizer = AVSpeechSynthesizer()
    private var lastSpoken = ""

    var enabled = true

    private init() {
        // .playAndRecord so coaching TTS and mic capture (pitch transcription)
        // share one session without fighting over the category. Routes to the
        // speaker; the session is only activated when we actually speak/record.
        try? AVAudioSession.sharedInstance().setCategory(
            .playAndRecord,
            mode: .spokenAudio,
            options: [.duckOthers, .defaultToSpeaker, .allowBluetooth]
        )
    }

    /// Speak a line. `force` bypasses the de-dup (used for "recording on" and
    /// other one-shot announcements that must always play).
    func speak(_ text: String, force: Bool = false) {
        guard enabled, !text.isEmpty else { return }
        if !force, text == lastSpoken { return }
        lastSpoken = text

        try? AVAudioSession.sharedInstance().setActive(true)
        synthesizer.stopSpeaking(at: .immediate)

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice =
            AVSpeechSynthesisVoice(language: "en-AU")
            ?? AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate
        synthesizer.speak(utterance)
    }

    func reset() {
        lastSpoken = ""
    }

    func stop() {
        synthesizer.stopSpeaking(at: .immediate)
    }
}
