# Foreman iOS (Meta glasses path)

Native iOS app that streams frames through the Meta Wearables DAT SDK to the Foreman backend. Supports **MockDeviceKit** (phone camera) and **real Meta glasses** — the analyse pipeline is identical; only the frame source changes.

## Cursor AI setup (DAT SDK)

Meta Wearables DAT config is installed in `.cursor/rules/` (9 rule files). Reload Cursor or reopen the project to pick them up.

**MCP** (`.cursor/mcp.json`): `wearables-dat` → live DAT docs search via `https://mcp.facebook.com/wearables_dat`.

**Optional — full API reference in chat:** Cursor **Settings → Features → Docs → Add new doc** → URL `https://wearables.developer.meta.com/llms.txt?full=true`, name “Wearables DAT SDK”. Then use `@Docs` in chat.

> The `/plugin marketplace` commands in Meta’s docs are for **Claude Code**, not Cursor. For Cursor, use the install script above (already run in this repo).

## Prerequisites

- Mac with **Xcode 15+**
- **iPhone** on iOS 16+ (physical device required)
- Foreman **backend running** (`npm run dev:backend`)
- Supabase configured in `backend/.env`
- For real glasses: **Ray-Ban Meta** (or compatible DAT glasses) + **Meta AI** app

---

## Switching: mock device → real glasses

The switch is one build flag. `StreamViewModel` and the backend are unchanged.

| Setting | Mock (Iteration 4) | Real glasses (Iteration 5) |
|---------|-------------------|---------------------------|
| `FOREMAN_USE_MOCK_DEVICE` | `YES` | `NO` |
| `META_APP_ID` | `0` | From Wearables Developer Center |
| `CLIENT_TOKEN` | empty | From Wearables Developer Center |
| MockDeviceKit | Enabled at launch | **Not** enabled |
| Frame source | Phone back camera via mock | Live Bluetooth stream from glasses |

Edit `Foreman/Config/Debug.xcconfig` (see `RealGlasses.xcconfig.example`), then:

```bash
cd native/ios && xcodegen generate
```

---

## Real Meta glasses — step by step

### 1. Wearables Developer Center

1. Open [Wearables Developer Center](https://wearables.developer.meta.com/) and sign in.
2. Create an **organization** (if you have not already).
3. Create a **project** named Foreman.
4. Register your iOS bundle ID: `com.foreman.app`
5. Copy from the project settings:
   - **Meta App ID**
   - **Client Token**
6. Create a **release channel** and add your test Apple ID / testers (required for distributing builds outside the App Store during preview).

### 2. Apple Developer

1. Register App ID `com.foreman.app` at [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list).
2. Copy your **Team ID** (Membership details).

### 3. Configure the app

In `Foreman/Config/Debug.xcconfig`:

```
FOREMAN_USE_MOCK_DEVICE = NO
META_APP_ID = <from developer center>
CLIENT_TOKEN = <from developer center>
DEVELOPMENT_TEAM = <your Apple Team ID>
BACKEND_API_URL = http://<your-mac-lan-ip>:8080
```

Regenerate the Xcode project:

```bash
cd native/ios && xcodegen generate
```

### 4. Prepare the glasses

1. Install **Meta AI** on your iPhone (same phone that runs Foreman).
2. Pair your **Ray-Ban Meta** glasses in Meta AI.
3. In Meta AI → **Settings** → your glasses → enable **Developer Mode**.
4. Put the glasses on (powered on, unfolded, worn). They must show as connected in Meta AI.

### 5. Register Foreman with Meta AI (first launch)

1. Build and run Foreman on your iPhone from Xcode.
2. Tap **I understand**.
3. In the **Glasses connection** panel, tap **Register with Meta AI**.
4. Meta AI opens — approve Foreman as a wearables integration.
5. Meta AI redirects back to Foreman via `foreman://` (handled in `ForemanApp.swift`).

Connection panel should show **Registration: Registered**.

### 6. Grant camera permission

1. Tap **Grant camera** in Foreman.
2. Meta AI opens the glasses camera permission flow — approve access.
3. Return to Foreman. Panel should show **Camera permission: Granted**.

A device will not appear in the devices list until camera permission is granted.

### 7. Confirm glasses are visible

The connection panel should show:

- Registration: **Registered**
- Camera permission: **Granted**
- Devices visible: **1** (or more)
- Status: **Meta glasses connected — live feed ready**

If device count is 0: open Meta AI, confirm glasses are connected and worn, then return to Foreman.

### 8. Run a live coaching job

1. Start the backend on your Mac: `npm run dev:backend`
2. In Foreman, tap **Start job**.
3. The preview shows the **live glasses camera** (not the phone camera).
4. Coaching updates every ~4 seconds from `/analyse`.
5. Tap **Stop job** — you get the session summary and Supabase counts.

**Confirm live coaching:** point the glasses at a work scene, watch the preview match what the glasses see (not the phone's rear camera), and verify coaching text reflects that scene.

---

## Mock device development (Iteration 4)

Set `FOREMAN_USE_MOCK_DEVICE = YES` in `Debug.xcconfig`. MockDeviceKit pairs a simulated Ray-Ban Meta and pipes the **phone back camera** into the DAT stream.

```bash
npm run dev:backend
cd native/ios && xcodegen generate && open Foreman.xcodeproj
```

Run on a physical iPhone → **I understand** → **Start job**.

---

## Pipeline (unchanged between mock and real)

```
Frame source (mock camera OR Meta glasses)
    → DAT Stream (videoFramePublisher)
    → sample frame every 4s
    → POST /sessions/start, POST /analyse, POST /sessions/stop
    → coaching overlay + job summary
```

`StreamViewModel.swift` uses `AutoDeviceSelector` + `DeviceSession.addStream()` for both modes. The backend is not modified.

---

## Meta toolkit docs (MCP)

Add remote MCP in Cursor:

- URL: `https://mcp.facebook.com/wearables_dat`
- Tool: `search_dat_docs`

Static API: [wearables.developer.meta.com/llms.txt?full=true](https://wearables.developer.meta.com/llms.txt?full=true)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Registration stays "Unavailable" | Check `META_APP_ID`, `CLIENT_TOKEN`, `TeamID` in xcconfig; regenerate project |
| Meta AI does not open | Install Meta AI; confirm `LSApplicationQueriesSchemes` includes `fb-viewapp` |
| Callback fails after registration | URL scheme must be `foreman://` in Info.plist and match Wearables Developer Center |
| Devices visible: 0 | Enable Developer Mode on glasses; grant camera permission; wear glasses; check Meta AI connection |
| Preview shows phone camera on real mode | Confirm `FOREMAN_USE_MOCK_DEVICE = NO` and rebuild; MockDeviceKit must not be enabled |
| Network errors | `BACKEND_API_URL` must use Mac LAN IP; phone and Mac on same Wi‑Fi |
| App Store rejection | Expected during preview — distribute via Wearables release channels to testers |

---

## Folder layout

```
native/ios/Foreman/
├── ForemanApp.swift              # SDK init + Meta AI URL callback
├── ContentView.swift             # UI + Start/Stop job
├── Services/
│   ├── DeviceMode.swift          # mock vs real flag
│   ├── MockDeviceManager.swift   # mock-only setup
│   └── BackendClient.swift
├── ViewModels/
│   ├── WearablesConnectionViewModel.swift  # registration + permissions
│   └── StreamViewModel.swift     # DAT stream + analyse (unchanged)
└── Views/
    ├── WearablesConnectionView.swift
    ├── CoachingView.swift
    └── SessionSummaryView.swift
```
