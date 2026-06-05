import Foundation
import MWDATMockDevice

enum MockDeviceManagerError: LocalizedError {
    case pairingFailed

    var errorDescription: String? {
        switch self {
        case .pairingFailed:
            return "Could not pair the mock Ray-Ban Meta device."
        }
    }
}

@MainActor
final class MockDeviceManager {
    static let shared = MockDeviceManager()

    private(set) var isReady = false
    private(set) var statusMessage = "Mock device not configured"

    func configureForDevelopment() async throws {
        #if DEBUG
        MockDeviceKit.shared.enable(
            config: MockDeviceKitConfig(
                initiallyRegistered: true,
                initialPermissionsGranted: true
            )
        )

        let device = MockDeviceKit.shared.pairRaybanMeta()
        device.powerOn()
        device.unfold()
        device.don()
        await device.services.camera.setCameraFeed(cameraFacing: .back)

        isReady = true
        statusMessage = "Mock glasses ready — back camera feed active"
        #else
        throw MockDeviceManagerError.pairingFailed
        #endif
    }
}
