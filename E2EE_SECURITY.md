# HerLife End-to-End Encryption (E2EE) Architecture

This document defines the Zero-Knowledge E2EE protocol for HerLife, ensuring the server never sees plaintext emotional or wellness data.

## 1. Key Generation

We use a hierarchical key structure to balance security and usability.

- **Master Key (MK):** Derived from the user's password using **PBKDF2** (SHA-256) with 600,000 iterations.
- **Data Encryption Key (DEK):** A random 256-bit AES key generated using `crypto.getRandomValues()`.
- **Key Wrapping:** The DEK is encrypted with the Master Key before being sent to the server.

---

## 2. Key Storage

- **Device Level:** Keys are never stored in `localStorage` in plaintext. We use the **IndexedDB** or the **Web Crypto Key Storage** (which can be backed by hardware security like Secure Enclave).
- **Server Level:** The server only stores the **Wrapped DEK**, the **Salt** used for PBKDF2, and the **IV** used for wrapping. The server cannot unwrap the DEK without the user's password.

---

## 3. Encryption Lifecycle

1. **Input:** User types a message in Aura.
2. **Key Retrieval:** Frontend retrieves the DEK from the local secure store.
3. **Encryption:** Message is encrypted using **AES-256-GCM** with a unique 12-byte IV.
4. **Payload Construction:** `{ cipher: Base64, iv: Base64, tag: Base64 }`.
5. **Transmission:** The encrypted blob is sent via HTTPS to the backend.

---

## 4. Decryption Lifecycle

1. **Retrieval:** Frontend fetches the encrypted blob from the backend.
2. **Decryption:** Frontend uses the DEK and the provided IV/Tag to decrypt the message.
3. **Display:** Plaintext is rendered in the UI and then cleared from volatile memory.

---

## 5. Multi-Device Sync

To allow access from multiple devices:
1. Device A uploads the **Wrapped DEK** (encrypted with MK) to the server.
2. Device B prompts the user for their password, derives the same MK, downloads the Wrapped DEK, and unwraps it locally.

---

## 6. Password-Derived Keys (PBKDF2)

We use a unique salt per user to prevent rainbow table attacks.
- **Algorithm:** PBKDF2-HMAC-SHA256
- **Iterations:** 600,000 (OWASP recommended)
- **Salt:** 16 bytes random

---

## 7. Key Exchange (X25519)

For sharing data with **Trusted Contacts**:
1. User A generates an ephemeral X25519 key pair.
2. User A uses User B's public key to derive a shared secret.
3. User A encrypts the DEK with this shared secret and sends it to User B.

---

## 8. Recovery Limitations (The Cost of Security)

Since HerLife is **Zero-Knowledge**:
- If a user forgets their password AND loses all authenticated devices, **DATA IS PERMANENTLY LOST**.
- There is no "Password Reset" that can recover data, as the server never has the keys.

---

## 9. Metadata Leakage

While the content is E2EE, certain metadata remains visible to the server for operational purposes:
- **Timestamp:** When the message was sent.
- **Size:** Approximate length of the encrypted blob.
- **User ID:** Ownership of the record.

We mitigate this by using padding to normalize blob sizes where possible.

---

## 10. Secure Encrypted Uploads (Audio/Evidence)

For large files (Her Eye recordings):
1. Generate a random File Encryption Key (FEK).
2. Encrypt the file stream using AES-GCM.
3. Upload the encrypted file to Cloud Storage.
4. Store the FEK (wrapped with the user's DEK) in the database.

---

## Encryption Flow (Mermaid)

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Server

    User->>Browser: Enters Password
    Browser->>Browser: PBKDF2(Password, Salt) -> Master Key
    Browser->>Browser: Generate Random DEK
    Browser->>Browser: AES-GCM-Wrap(DEK, Master Key) -> Wrapped DEK
    Browser->>Server: Store Wrapped DEK + Salt

    Note over Browser, Server: Data remains encrypted everywhere except Browser

    User->>Browser: Writes Journal
    Browser->>Browser: AES-GCM-Encrypt(Journal, DEK) -> Blob
    Browser->>Server: POST /v1/journal { blob }
```
