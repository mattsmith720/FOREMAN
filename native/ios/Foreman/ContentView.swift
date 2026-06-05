import SwiftUI

struct ContentView: View {
    @StateObject private var streamViewModel = StreamViewModel()
    @StateObject private var connectionViewModel = WearablesConnectionViewModel()
    @State private var hasConsented = false
    @State private var isJobActive = false
    @State private var isSummarising = false
    @State private var endedSession: SessionRow?
    @State private var storedCounts: SessionCounts?

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                statusHeader

                previewSurface

                if !hasConsented {
                    consentCard
                } else if let endedSession, let storedCounts {
                    SessionSummaryView(session: endedSession, stored: storedCounts)
                } else {
                    WearablesConnectionView(connection: connectionViewModel)
                    CoachingView(coaching: streamViewModel.coaching)
                }

                if let error = streamViewModel.errorMessage ?? connectionViewModel.errorMessage {
                    Text(error)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(12)
                        .background(Color.red.opacity(0.12), in: RoundedRectangle(cornerRadius: 12))
                }

                controls
            }
            .padding()
            .navigationTitle("Foreman")
            .task {
                await connectionViewModel.start()
            }
        }
    }

    private var statusHeader: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Live coach")
                    .font(.headline)
                Text(connectionViewModel.deviceModeLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Label(streamViewModel.streamStateLabel, systemImage: "dot.radiowaves.left.and.right")
                .font(.caption.weight(.semibold))
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(.ultraThinMaterial, in: Capsule())
        }
    }

    private var previewSurface: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.black)

            if let previewImage = streamViewModel.previewImage {
                Image(uiImage: previewImage)
                    .resizable()
                    .scaledToFill()
                    .clipShape(RoundedRectangle(cornerRadius: 20))
            } else {
                Text(DeviceMode.useMockDevice ? "Mock glasses preview" : "Glasses preview")
                    .foregroundStyle(.secondary)
            }

            if isJobActive {
                Text("RECORDING")
                    .font(.caption2.weight(.bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.red.opacity(0.8), in: Capsule())
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
                    .padding(12)
            }
        }
        .frame(height: 320)
        .clipped()
    }

    private var consentCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Before you start")
                .font(.headline)
            Text(consentText)
                .font(.subheadline)

            Button("I understand") {
                hasConsented = true
            }
            .buttonStyle(.borderedProminent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private var consentText: String {
        if DeviceMode.useMockDevice {
            return "Foreman uses a mock glasses feed (your phone camera) during development. Footage is sent to our backend for analysis. Do not start without consent from everyone in view."
        }
        return "Foreman streams live video from your Meta glasses to our backend for coaching. Do not start without consent from everyone in view."
    }

    private var controls: some View {
        HStack(spacing: 12) {
            Button("Start job") {
                Task { await startJob() }
            }
            .buttonStyle(.borderedProminent)
            .disabled(!hasConsented || !connectionViewModel.isReady || isJobActive || isSummarising)

            Button("Stop job") {
                Task { await stopJob() }
            }
            .buttonStyle(.bordered)
            .disabled(!isJobActive || isSummarising)
        }
    }

    private func startJob() async {
        endedSession = nil
        storedCounts = nil
        isJobActive = true
        await streamViewModel.startJob()
        if streamViewModel.errorMessage != nil {
            isJobActive = false
        }
    }

    private func stopJob() async {
        isSummarising = true
        isJobActive = false

        if let result = await streamViewModel.stopJob() {
            endedSession = result.0
            storedCounts = result.1
        }

        isSummarising = false
    }
}
