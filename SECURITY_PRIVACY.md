# HerLife Aura Privacy Architecture

## Aura Session Modes

- Private Aura Session: no permanent storage, no cloud sync, no long-term memory. The web build also enables a privacy curtain when the app loses focus. Native iOS and Android builds should add screenshot blocking through `isScreenCaptureDisabled`, `FLAG_SECURE`, and OS keychain controls.
- Temporary Session Only: messages are kept in session storage and disappear when the browser/app session ends.
- Save Chat History: messages are encrypted on device with AES-GCM before local storage or cloud sync. Production sync should upload only encrypted payloads.

## Encryption Model

- Client-side AES-GCM encryption is implemented in `app.js`.
- Production builds should move key material to Secure Enclave/Keychain on iOS and Android Keystore on Android.
- Cloud providers should receive encrypted blobs, never plaintext emotional conversations.
- Token-based sessions should use short-lived access tokens and refresh token rotation.

## Minimal Data Policy

- Aura does not retain emotional memory unless the user chooses encrypted history.
- Private and temporary chats do not create permanent logs.
- Anonymous AI processing should strip identifiers, location, contact data, and safety session IDs before model calls.
- Account deletion should remove profile data, encrypted chat blobs, emergency logs, consent logs where legally allowed, and notification tokens.

## Official Website Access

- Primary web entry: `https://herlife.app`
- Secure launch domain: `https://secure.herlife.app`
- App routes: `herlife://aura`, `herlife://safety`, `web+herlife:`
- Universal Links and Android App Links are scaffolded in `.well-known/`.
