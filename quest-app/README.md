# Healthpack Squad for Meta Quest

This Android app is a lightweight WebView wrapper for:

`https://zero9421903821938129.onrender.com`

The website is loaded from Render every time the app opens. Normal website
changes therefore do not require a new APK. A new APK is needed only when the
native wrapper itself changes, such as Android permissions or the destination
URL.

## Included

- Quest-compatible landscape Android window
- JavaScript, cookies, and local storage
- Microphone permission forwarding for WebRTC calls
- Profile image/video file picker
- YouTube and HTML fullscreen handling
- External links opened outside the app
- Offline retry screen

## Build

GitHub Actions builds an installable debug APK whenever files under
`quest-app/` change, or when the workflow is run manually.

Download the `healthpack-quest-apk` artifact from the completed workflow and
extract `app-debug.apk`.

## Install on Quest 3

Enable Developer Mode for the headset, then install the APK using Meta Quest
Developer Hub by dragging the APK onto the connected device. The app appears
under the headset's unknown-sources/developer applications.

On first call join, allow microphone access.
