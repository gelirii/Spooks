# Spooks — Browser Interrogation

A privacy-education GitHub Pages demo showing how much an ordinary browser can reveal before a site asks for permission, followed by one deeper-scan button for permission-gated capabilities.

## Privacy model

Spooks is a static client-side application. GitHub Pages necessarily receives normal requests for the HTML, CSS and JavaScript files and can therefore see ordinary request metadata such as the visitor's IP address.

The scanner itself has:

- no analytics
- no third-party APIs or CDNs
- no external fonts or images
- no tracking pixels
- no `fetch()` or XHR calls
- no WebSockets
- no cookies set by the scanner
- no `localStorage`, `sessionStorage`, or IndexedDB writes
- no server-side collection code

No discovered device value is deliberately placed into a network request. Scan results are calculated and displayed locally.

## Passive scan

Depending on browser support, Spooks probes browser and OS clues, locale and timezone, screen and viewport geometry, display preferences, touch and pointer capabilities, CPU threads and approximate memory, refresh cadence, graphics/WebGL/WebGPU details, canvas and offline-audio rendering fingerprints, a fixed-list font inference test, storage quota, battery and network information, codecs and voices, media-device counts, connected gamepads, browser capability surfaces, permission states, referrer/navigation clues, and motion/orientation where a browser exposes them without a prompt.

The **Fingerprint / Browser shadow** is a full SHA-256 produced locally from a stable set of permissionless traits. It demonstrates how individually harmless browser properties can combine into something that feels like an identifier. It is not saved or transmitted.

Public IP lookup is deliberately excluded because doing that reliably would require contacting another service.

## Deeper scan

The single **WILL YOU LET ME FIND OUT MORE?** button starts every supported deeper probe that can reasonably be requested from one user action. Browsers may still show several prompts because location, camera, microphone, motion sensors, clipboard access and other capabilities are separate security boundaries.

Potential deeper results include:

- precise geolocation
- camera metadata and capabilities
- microphone metadata and capabilities
- one locally displayed camera still
- motion and orientation readings
- clipboard text
- installed local font metadata
- multi-screen/window-management details
- idle and screen-lock state
- high-entropy User-Agent Client Hints

Camera and microphone access are requested separately. If camera permission is granted, Spooks intentionally captures **one camera frame** and displays it locally as an in-memory JPEG data URL. It is not uploaded or saved and disappears when the page is refreshed or closed. The camera stream is then stopped.

Microphone permission is metadata-only. No microphone audio sample is read, recorded or stored. The microphone stream is stopped after its settings and capabilities have been inspected.

Media settings and capabilities are translated into human-readable descriptions such as active resolution, frame rate, facing direction, sample rate, channel count, echo cancellation and supported ranges rather than displaying raw JavaScript objects.

USB, Serial, HID, Bluetooth device choosers, files/folders, contacts and screen-capture pickers are not forced automatically because those APIs require the user to select a specific thing rather than simply grant a general permission.

## GitHub Pages

In the repository:

1. Open **Settings**.
2. Open **Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save.

The root `index.html` is the site entry point.
