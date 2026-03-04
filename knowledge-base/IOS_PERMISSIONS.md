# iOS Permissions & Camera Access Guide
> Covers both the web prototype (React/Safari) and the future native iOS app.

---

## The Problem

The user reported: **camera access denied on iOS**. This breaks Live Mode and Setup Assistant.

On iOS Safari, camera permissions are:
1. Per-site, stored by Safari
2. NOT remembered between sessions unless user explicitly allows
3. Show a system prompt the first time only — if dismissed without choosing, it defaults to "Ask"
4. Cannot be opened programmatically from a browser — user must go to Settings manually

---

## Web Prototype Fix (React / Safari)

### How `getUserMedia` works on iOS Safari

```javascript
try {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  // success — stream is live
} catch (err) {
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    // User denied — show instructions
    showCameraPermissionModal();
  } else if (err.name === 'NotFoundError') {
    // No camera found — device issue
    showNoCameraModal();
  } else if (err.name === 'NotSupportedError') {
    // HTTP (not HTTPS) — won't work
    showHttpsRequiredModal();
  }
}
```

### The Permission Modal Component

Show this when permission is denied. **This is the fix the user needs.**

```tsx
function CameraPermissionModal({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="camera-permission-overlay">
      <div className="camera-permission-card">
        <div className="permission-icon">📷</div>
        <h2>Camera Access Required</h2>
        <p>Golf Swing AI needs camera access for Live Mode and Setup Assistant.</p>

        <div className="permission-steps">
          <p className="steps-header">To enable on iPhone:</p>
          <ol>
            <li>Open the <strong>Settings</strong> app</li>
            <li>Scroll down and tap <strong>Safari</strong></li>
            <li>Tap <strong>Camera</strong></li>
            <li>Select <strong>Allow</strong></li>
            <li>Return here and tap "Try Again"</li>
          </ol>
        </div>

        <button className="permission-retry-btn" onClick={onRetry}>
          Try Again
        </button>
      </div>
    </div>
  );
}
```

### Steps for different browsers on iOS

**Safari (most common):**
> Settings → Safari → Camera → [site or "Allow"]

**Chrome on iOS:**
> Settings → Chrome → Camera → Allow

**Firefox on iOS:**
> Settings → Firefox → Camera → Allow

### Implementation Notes
- On iOS, you MUST be on HTTPS — `getUserMedia` silently fails on HTTP
- The VPS serves on port 8004 — if accessing via IP:port, iOS may block without HTTPS
- During dev: use `localhost` (iOS allows camera on localhost) or serve with a self-signed cert
- Production: must have valid SSL certificate

---

## Native iOS App Fix (Future — Swift/SwiftUI)

### Info.plist Entry (REQUIRED)
```xml
<key>NSCameraUsageDescription</key>
<string>Golf Swing AI uses your camera to analyze your golf swing in real-time.</string>
```
Without this, the app crashes on first camera access. App Store will reject it.

### AVCaptureDevice Permission Flow
```swift
import AVFoundation

func requestCameraPermission(completion: @escaping (Bool) -> Void) {
    switch AVCaptureDevice.authorizationStatus(for: .video) {
    case .authorized:
        completion(true)
    case .notDetermined:
        AVCaptureDevice.requestAccess(for: .video) { granted in
            DispatchQueue.main.async { completion(granted) }
        }
    case .denied, .restricted:
        // Show settings deep-link
        completion(false)
    @unknown default:
        completion(false)
    }
}

// Open Settings deep-link when denied
func openCameraSettings() {
    guard let settingsUrl = URL(string: UIApplication.openSettingsURLString) else { return }
    UIApplication.shared.open(settingsUrl)
}
```

### SwiftUI Permission View
```swift
struct CameraPermissionView: View {
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: "camera.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)

            Text("Camera Access Required")
                .font(.title2.bold())

            Text("Golf Swing AI needs camera access to analyze your swing in real time.")
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            Button("Open Settings") {
                openCameraSettings()
            }
            .buttonStyle(.borderedProminent)
            .tint(.blue)
        }
        .padding(32)
    }
}
```

---

## PrivacyInfo.xcprivacy (App Store Requirement 2024+)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" ...>
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryCamera</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string> <!-- Core app functionality -->
            </array>
        </dict>
    </dict>
    </array>
</dict>
</plist>
```

---

## Testing Camera Permission on iOS

### Reset permissions (for testing denied state):
1. iOS Settings → General → Transfer or Reset iPhone → Reset → Reset Location & Privacy
2. Or per-site: Settings → Safari → Advanced → Website Data → delete the site

### Test scenarios to cover:
1. **First visit** — permission prompt appears → user allows → camera works ✅
2. **First visit** — permission prompt appears → user denies → modal shows with instructions ✅
3. **Previously denied** — no prompt, immediate error → modal shows ✅
4. **User follows instructions, taps Try Again** — new prompt appears → allows → camera works ✅
5. **HTTPS required** — HTTP only → silent failure → detect and show modal ✅

---

## HTTPS on the VPS

The web prototype runs on `http://89.117.22.186:8004`. iOS Safari blocks `getUserMedia` on HTTP.

**Workarounds:**
1. Set up nginx + Let's Encrypt SSL in front of port 8004
2. Use a domain name + Cloudflare (free SSL)
3. For local testing: access via `localhost:3000` (CRA dev server — camera allowed on localhost)
4. Temporary: use ngrok tunnel for HTTPS

**Recommended**: Add Cloudflare or nginx SSL termination before iOS beta testing.

---

## Microphone Permission (future — audio coach)

Same flow but `NSMicrophoneUsageDescription` in Info.plist.

```swift
case .audio:
    AVAudioSession.sharedInstance().requestRecordPermission { granted in ... }
```
