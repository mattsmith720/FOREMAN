import SwiftUI

struct WearablesConnectionView: View {
    @ObservedObject var connection: WearablesConnectionViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("GLASSES CONNECTION")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.secondary)

            Text(connection.deviceModeLabel)
                .font(.subheadline.weight(.medium))

            connectionRow("Registration", value: connection.registrationLabel)
            connectionRow("Camera permission", value: connection.cameraPermissionLabel)
            connectionRow("Devices visible", value: "\(connection.deviceCount)")

            Text(connection.statusMessage)
                .font(.caption)
                .foregroundStyle(.secondary)

            if !DeviceMode.useMockDevice {
                HStack(spacing: 10) {
                    Button("Register with Meta AI") {
                        Task { await connection.registerWithMeta() }
                    }
                    .buttonStyle(.bordered)

                    Button("Grant camera") {
                        Task { await connection.requestCameraAccess() }
                    }
                    .buttonStyle(.bordered)
                    .disabled(connection.registrationLabel != "Registered")
                }
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
    }

    private func connectionRow(_ title: String, value: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(value)
                .foregroundStyle(.secondary)
        }
        .font(.caption)
    }
}
