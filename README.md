# Spooks — Browser Interrogation

A self-contained privacy-education webpage that demonstrates how much an ordinary browser can reveal before a site asks for permission, then offers one deeper-scan button for permission-gated capabilities.

## Privacy model

The application is intentionally contained in a single `index.html` file.

- no analytics
- no remote JavaScript
- no CDN assets
- no external fonts or images
- no `fetch()` or XHR calls
- no WebSockets
- no cookies set by the scanner
- no `localStorage`, `sessionStorage`, or IndexedDB writes
- no server-side collection code

GitHub Pages must still receive the normal HTTPS request needed to serve the page, so GitHub may receive ordinary request metadata such as the visitor's IP address. Values discovered by the scanner are displayed locally and are not deliberately transmitted by the application.

## Passive scan

Depending on browser support, the page probes browser/OS clues, locale and timezone, screen and viewport geometry, display preferences, touch/pointer capabilities, logical CPU threads, approximate memory, WebGL/WebGPU data, canvas and offline-audio rendering fingerprints, common-font inference, connection information, local WebRTC ICE candidates without STUN/TURN servers, storage quota estimates, battery information, media/codecs, permission states and browser capability flags.

Public IP lookup is deliberately excluded because doing it reliably would require contacting another service.

## Deeper scan

The single **WILL YOU LET ME FIND OUT MORE?** button starts the permission-gated probes supported by the current browser. The browser may still display multiple permission prompts because these are separate security boundaries.

Potential deeper results include:

- precise geolocation
- camera and microphone device/track metadata
- motion and orientation sensor readings
- clipboard text
- installed local font metadata
- multi-screen/window-management details
- idle and screen-lock state
- higher-entropy User-Agent Client Hints

Camera and microphone streams are stopped immediately after metadata inspection. The application does not read camera frames or microphone samples.

Device/file pickers such as USB, Serial, HID, Bluetooth, files, contacts and screen sharing are intentionally not opened automatically because those APIs require the user to select a specific thing rather than simply grant a general permission.

## GitHub Pages

In the repository:

1. Open **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save.

The root `index.html` is then the site entry point.
