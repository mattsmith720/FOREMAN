import Foundation
import MWDATCore

@MainActor
final class WearablesConnectionViewModel: ObservableObject {
    @Published var statusMessage = "Checking connection..."
    @Published var registrationLabel = "Checking..."
    @Published var cameraPermissionLabel = "Checking..."
    @Published var deviceCount = 0
    @Published var isReady = false
    @Published var errorMessage: String?

    private var observerTasks: [Task<Void, Never>] = []

    var deviceModeLabel: String { DeviceMode.label }

    func start() async {
        errorMessage = nil

        if DeviceMode.useMockDevice {
            await configureMockDevice()
            return
        }

        startObservingRealDevice()
        await refreshRealDeviceState()
    }

    func registerWithMeta() async {
        errorMessage = nil

        do {
            try await Wearables.shared.startRegistration()
            statusMessage = "Complete registration in the Meta AI app, then return to Foreman."
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func requestCameraAccess() async {
        errorMessage = nil

        do {
            let status = try await Wearables.shared.requestPermission(.camera)
            cameraPermissionLabel = permissionLabel(status)
            await refreshRealDeviceState()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func configureMockDevice() async {
        do {
            try await MockDeviceManager.shared.configureForDevelopment()
            registrationLabel = "Simulated (MockDeviceKit)"
            cameraPermissionLabel = "Simulated (MockDeviceKit)"
            deviceCount = 1
            isReady = MockDeviceManager.shared.isReady
            statusMessage = MockDeviceManager.shared.statusMessage
        } catch {
            isReady = false
            errorMessage = error.localizedDescription
            statusMessage = "Mock device setup failed"
        }
    }

    private func startObservingRealDevice() {
        observerTasks.forEach { $0.cancel() }
        observerTasks.removeAll()

        observerTasks.append(Task {
            for await state in Wearables.shared.registrationStateStream() {
                await MainActor.run {
                    self.registrationLabel = self.registrationLabel(state)
                    self.updateReadyState()
                }
            }
        })

        observerTasks.append(Task {
            for await devices in Wearables.shared.devicesStream() {
                await MainActor.run {
                    self.deviceCount = devices.count
                    self.updateReadyState()
                }
            }
        })
    }

    private func refreshRealDeviceState() async {
        let wearables = Wearables.shared
        registrationLabel = registrationLabel(wearables.registrationState)

        do {
            let cameraStatus = try await wearables.checkPermissionStatus(.camera)
            cameraPermissionLabel = permissionLabel(cameraStatus)
        } catch {
            cameraPermissionLabel = "Error"
            errorMessage = error.localizedDescription
        }

        deviceCount = wearables.devices.count
        updateReadyState()
    }

    private func updateReadyState() {
        let registered = Wearables.shared.registrationState == .registered
        let hasCamera = cameraPermissionLabel == "Granted"
        let hasDevice = deviceCount > 0

        isReady = registered && hasCamera && hasDevice

        if isReady {
            statusMessage = "Meta glasses connected — live feed ready"
        } else if !registered {
            statusMessage = "Register Foreman with Meta AI to continue"
        } else if !hasCamera {
            statusMessage = "Grant camera permission for your glasses"
        } else if !hasDevice {
            statusMessage = "Put on your glasses and open Meta AI to connect"
        } else {
            statusMessage = "Preparing glasses connection..."
        }
    }

    private func registrationLabel(_ state: RegistrationState) -> String {
        switch state {
        case .registered: return "Registered"
        case .registering: return "Registering..."
        case .available: return "Available — tap Register"
        case .unavailable: return "Unavailable"
        @unknown default: return "Unknown"
        }
    }

    private func permissionLabel(_ status: PermissionStatus) -> String {
        switch status {
        case .granted: return "Granted"
        case .denied: return "Denied"
        @unknown default: return "Unknown"
        }
    }
}
