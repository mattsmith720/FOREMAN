import Foundation

enum DeviceMode {
    /// When true, MockDeviceKit feeds the phone camera into the DAT stream.
    /// When false, frames come from paired Meta glasses over the real DAT stack.
    static var useMockDevice: Bool {
        guard
            let value = Bundle.main.object(forInfoDictionaryKey: "FOREMAN_USE_MOCK_DEVICE") as? String
        else {
            return false
        }

        switch value.uppercased() {
        case "YES", "1", "TRUE":
            return true
        default:
            return false
        }
    }

    static var label: String {
        useMockDevice ? "Mock glasses (phone camera)" : "Meta glasses (live)"
    }
}
