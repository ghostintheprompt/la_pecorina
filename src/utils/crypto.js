/**
 * La Pecorina — Hardened Cryptographic Utilities
 *
 * Implements AES-256-GCM authenticated encryption with PBKDF2-SHA256 key derivation.
 *
 * Design decisions:
 *  - AES-GCM provides authenticated encryption (confidentiality + integrity + authenticity
 *    in one primitive). A separate HMAC is not needed. This eliminates the padding oracle
 *    attack surface present in AES-CBC, where an attacker can distinguish padding errors
 *    from decryption errors and recover plaintext one byte at a time.
 *  - PBKDF2 with 310,000 iterations (OWASP 2023 minimum for PBKDF2-SHA256) makes
 *    dictionary and brute-force attacks computationally expensive. A random 128-bit salt
 *    prevents precomputation attacks (rainbow tables, lookup tables).
 *  - The Web Crypto API performs all key operations in native code. Key material never
 *    appears in JS heap as a recoverable string. CryptoKey objects are marked non-extractable
 *    (extractable: false), so they cannot be serialized or exfiltrated via storage.
 *
 * Side-channel note:
 *  JavaScript's garbage collector means we cannot guarantee memory zeroing of sensitive
 *  string values. The mitigation strategy here is: never store raw key material in JS
 *  variables beyond the scope of a single async call. Key derivation and encryption happen
 *  in the same await chain; intermediate CryptoKey objects go out of scope immediately.
 *  For defense-in-depth, callers should avoid logging or storing the plaintext password.
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
 * The CryptoKey is non-extractable — it cannot be read out of the Web Crypto subsystem.
 * @param {string} password
 * @param {Uint8Array} salt
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        { name: 'PBKDF2' },
        false,       // non-extractable
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
        false,       // non-extractable — key bytes cannot be read from JS
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypts plaintext with AES-256-GCM.
 *
 * Wire format (all concatenated, base64-encoded):
 *   [16 bytes salt][12 bytes IV][n bytes ciphertext+tag]
 *
 * The GCM authentication tag (16 bytes) is appended to the ciphertext by SubtleCrypto
 * automatically. Decryption will throw if the tag does not verify, preventing any
 * ciphertext manipulation attack.
 *
 * @param {string} plaintext
 * @param {string} password
 * @returns {Promise<string>} base64-encoded ciphertext envelope
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
 * Throws if authentication tag verification fails — indicating tampering or wrong password.
 * @param {string} envelope  base64-encoded ciphertext from encryptData()
 * @param {string} password
 * @returns {Promise<string>} decrypted plaintext
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
 * Uses crypto.getRandomValues — not Math.random, which is not cryptographically secure.
 * @param {number} byteLength
 * @returns {string} hex string of length byteLength * 2
 */
function secureRandomHex(byteLength) {
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates an Ethereum transaction object with strict type and format checks.
 * Input comes from an untrusted content script context — never trust it.
 * Prototype pollution mitigation: use Object.prototype.hasOwnProperty.call()
 * rather than trusting the object's own .hasOwnProperty method.
 * @param {unknown} transaction
 * @returns {boolean}
 */
function validateTransaction(transaction) {
    if (transaction === null || typeof transaction !== 'object' || Array.isArray(transaction)) {
        return false;
    }

    const required = ['from', 'to', 'amount'];
    for (const field of required) {
        // Prototype pollution guard: verify the field is an own property
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
 * Used for audit log chaining — each log entry stores the hash of the previous entry,
 * making the log tamper-evident.
 * @param {string} input
 * @returns {Promise<string>} hex digest
 */
async function sha256(input) {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

module.exports = {
    encryptData,
    decryptData,
    validateTransaction,
    secureRandomHex,
    sha256
};
