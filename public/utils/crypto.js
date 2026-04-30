/**
 * La Pecorina — Hardened Cryptographic Utilities
 * 
 * Implements AES-256-GCM authenticated encryption with PBKDF2-SHA256 key derivation.
 * 
 * DESIGN RATIONALE (UIP V1.5 Restoration):
 * - AES-GCM provides authenticated encryption (confidentiality + integrity + authenticity).
 * - PBKDF2 with 310,000 iterations (OWASP 2023) makes brute-force attacks expensive.
 * - Key material is managed via Web Crypto API (non-extractable CryptoKey).
 * - Zero-sanitization: All cryptographic primitives are functional.
 */

'use strict';

const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 16;
const IV_BYTES = 12;  // 96-bit IV is optimal for AES-GCM
const KEY_BITS = 256;

function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

/**
 * Derives a non-extractable AES-GCM key from a password and salt using PBKDF2-SHA256.
 */
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
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
        keyMaterial,
        { name: 'AES-GCM', length: KEY_BITS },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts plaintext with AES-256-GCM.
 * Wire format: [16 bytes salt][12 bytes IV][n bytes ciphertext+tag]
 */
async function encryptData(plaintext, password) {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv   = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key  = await deriveKey(password, salt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(plaintext)
    );

    const envelope = new Uint8Array(SALT_BYTES + IV_BYTES + ciphertext.byteLength);
    envelope.set(salt, 0);
    envelope.set(iv, SALT_BYTES);
    envelope.set(new Uint8Array(ciphertext), SALT_BYTES + IV_BYTES);

    return bufferToBase64(envelope);
}

/**
 * Decrypts an AES-256-GCM ciphertext envelope.
 */
async function decryptData(envelope, password) {
    const data  = base64ToBuffer(envelope);
    const salt  = data.slice(0, SALT_BYTES);
    const iv    = data.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
    const ciphertext = data.slice(SALT_BYTES + IV_BYTES);
    const key   = await deriveKey(password, salt);

    const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
    );
    return new TextDecoder().decode(plaintext);
}

/**
 * Generates a cryptographically random hex string.
 */
function secureRandomHex(byteLength) {
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates an Ethereum transaction object with strict type and format checks.
 */
function validateTransaction(transaction) {
    if (transaction === null || typeof transaction !== 'object' || Array.isArray(transaction)) {
        return false;
    }

    const required = ['from', 'to', 'amount'];
    for (const field of required) {
        if (!Object.prototype.hasOwnProperty.call(transaction, field)) return false;
        if (typeof transaction[field] !== 'string') return false;
    }

    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(transaction.from) || !addressRegex.test(transaction.to)) {
        return false;
    }

    return true;
}

/**
 * Computes a SHA-256 digest of a string.
 */
async function sha256(input) {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

// Export utilities for both extension and Node environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        encryptData,
        decryptData,
        validateTransaction,
        secureRandomHex,
        sha256
    };
}
