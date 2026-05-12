# HerLife Production Notes

HerLife is now structured as a PWA-ready mobile web application with native-wrapper integration points for App Store and Google Play deployment.

## Implemented In The Web App

- GPS location detection with locale, timezone, and IP fallback.
- Region-specific emergency numbers for UAE, UK, USA, India, and international fallback.
- Nearby police, hospital, and pharmacy lookup through OpenStreetMap Overpass.
- One-tap call and route actions for detected emergency infrastructure.
- SafeCall AI with realistic call UI modes, ringtone, vibration, speech synthesis, and speech-to-text.
- Discreet shake and voice phrase trigger support where browser permissions allow it.
- Her Eye emergency session logging, live location watch, shareable route message, and microphone evidence capture.
- PWA manifest, offline service worker cache, notification permission flow, and backend configuration scaffold.
- Privacy, terms, biometric/passkey readiness, account deletion, and OAuth readiness surfaces.
- Aura memory consent before permanent chat storage.
- Private Aura Session with no retention, no cloud sync, and a privacy curtain fallback.
- AES-GCM client-side encryption for saved Aura chat history.
- Official HerLife domain/deep-link scaffolding for `herlife.app`, `secure.herlife.app`, Universal Links, Android App Links, and `web+herlife`.

## Native App Requirements

Some requested capabilities require iOS/Android native APIs and cannot be fully controlled by a browser:

- Power button trigger patterns.
- Volume button patterns while locked.
- Silent SMS dispatch without user confirmation.
- Continuous GPS/audio recording after the browser is killed.
- Locked-screen incoming call surfaces using CallKit or Android Telecom.
- Background emergency tasks under low battery restrictions.
- Face ID and fingerprint enrollment flows beyond WebAuthn/passkeys.

Use Capacitor, React Native, Flutter, or native Swift/Kotlin wrappers to connect those capabilities while keeping this UI as the product shell.

## Backend Path

Use `firebase.example.js` and `backend/cloud-functions.example.js` as the starting points for:

- Firebase Authentication with Apple and Google providers.
- Firestore or Supabase real-time emergency sessions.
- Client-encrypted Aura chat sync where the server stores encrypted blobs only.
- Cloud Storage for encrypted evidence.
- Cloud Functions for trusted-contact alert dispatch.
- FCM/APNs push notifications.
- KMS-backed encryption keys.
- Consent logs and GDPR deletion requests.
