# iOS shell security

[felixgr/secure-ios-app-dev](https://github.com/felixgr/secure-ios-app-dev) is a checklist of common iOS app bugs, not a shippable app. MOTOR DRIVING SCHOOL SOFTWARE uses it as the review list for the Capacitor iOS shell in this folder.

The phone app is a WKWebView that opens the live HTTPS site. School records stay on the server. These controls from that checklist apply here:

- HTTPS only (App Transport Security, no cleartext, no mixed content)
- Recents snapshot covered when the app leaves the foreground
- System keyboard only (third-party keyboards cannot capture office passwords)
- iTunes file sharing off
- Stack canaries (`-fstack-protector-all`) and ARC (Xcode default)
- Sign-in fields disable autocorrect and do not log passwords

Build on a Mac with Xcode 15 or later:

```bash
APP_SERVER_URL=https://your-live-site.example npx cap sync ios
open ios/App/App.xcodeproj
```

Sign with your Apple Developer team. This machine cannot compile an IPA.
