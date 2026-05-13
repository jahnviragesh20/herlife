/**
 * HerLife E2EE Core Library
 * Uses Web Crypto API for AES-256-GCM and PBKDF2
 */

const PBKDF2_ITERATIONS = 600000;
const AES_GCM_TAG_LENGTH = 128;

/**
 * Derive a Master Key from a password and salt
 */
export async function deriveMasterKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        true,
        ['wrapKey', 'unwrapKey']
    );
}

/**
 * Generate a random Data Encryption Key (DEK)
 */
export async function generateDEK(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(data: string, key: CryptoKey): Promise<{ cipher: string, iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encodedData = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv, tagLength: AES_GCM_TAG_LENGTH },
        key,
        encodedData
    );

    return {
        cipher: arrayBufferToBase64(encrypted),
        iv: arrayBufferToBase64(iv)
    };
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(cipherBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
    const cipher = base64ToArrayBuffer(cipherBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv, tagLength: AES_GCM_TAG_LENGTH },
        key,
        cipher
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * Wrap (encrypt) a key for server-side storage
 */
export async function wrapKey(keyToWrap: CryptoKey, wrappingKey: CryptoKey): Promise<{ wrappedKey: string, iv: string }> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const wrapped = await crypto.subtle.wrapKey(
        'raw',
        keyToWrap,
        wrappingKey,
        { name: 'AES-GCM', iv }
    );

    return {
        wrappedKey: arrayBufferToBase64(wrapped),
        iv: arrayBufferToBase64(iv)
    };
}

/**
 * Unwrap (decrypt) a key from server-side storage
 */
export async function unwrapKey(wrappedKeyBase64: string, wrappingKey: CryptoKey, ivBase64: string): Promise<CryptoKey> {
    const wrappedKey = base64ToArrayBuffer(wrappedKeyBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    return crypto.subtle.unwrapKey(
        'raw',
        wrappedKey,
        wrappingKey,
        { name: 'AES-GCM', iv },
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Helper functions
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}
