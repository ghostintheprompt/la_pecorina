/**
 * Security tests for crypto.js
 * These tests attempt common attacks against the crypto module and verify they fail.
 */

'use strict';

const { encryptData, decryptData, validateTransaction, secureRandomHex, sha256 } = require('../../src/utils/crypto');

describe('AES-GCM Authentication — tamper detection', () => {
    test('decryption throws on bit-flipped ciphertext', async () => {
        const envelope = await encryptData('secret payload', 'password123');
        const bytes = Buffer.from(envelope, 'base64');
        bytes[bytes.length - 1] ^= 0x01;  // flip one bit in the auth tag region
        const tampered = bytes.toString('base64');

        await expect(decryptData(tampered, 'password123'))
            .rejects
            .toThrow();
    });

    test('decryption throws with wrong password', async () => {
        const envelope = await encryptData('secret', 'correct-password');
        await expect(decryptData(envelope, 'wrong-password')).rejects.toThrow();
    });

    test('encrypt/decrypt round-trips correctly', async () => {
        const plaintext = 'test payload 12345';
        const password = 'hunter2-but-longer-and-stronger';
        const envelope = await encryptData(plaintext, password);
        const decrypted = await decryptData(envelope, password);
        expect(decrypted).toBe(plaintext);
    });

    test('two encryptions of the same plaintext produce different ciphertexts (IV uniqueness)', async () => {
        const a = await encryptData('same plaintext', 'same password');
        const b = await encryptData('same plaintext', 'same password');
        expect(a).not.toBe(b);
    });
});

describe('validateTransaction — prototype pollution resistance', () => {
    test('rejects object with __proto__ pollution attempt', () => {
        const malicious = JSON.parse('{"__proto__":{"from":"0xdeadbeef0000000000000000000000000000dead","to":"0xdeadbeef0000000000000000000000000000dead","amount":"1"}}');
        expect(validateTransaction(malicious)).toBe(false);
    });

    test('rejects null', () => {
        expect(validateTransaction(null)).toBe(false);
    });

    test('rejects array', () => {
        expect(validateTransaction([])).toBe(false);
    });

    test('rejects object with inherited (not own) required fields', () => {
        const proto = { from: '0x' + 'a'.repeat(40), to: '0x' + 'b'.repeat(40), amount: '1' };
        const obj = Object.create(proto);
        expect(validateTransaction(obj)).toBe(false);
    });

    test('accepts valid transaction', () => {
        const valid = {
            from: '0x' + 'a'.repeat(40),
            to:   '0x' + 'b'.repeat(40),
            amount: '1000000000000000000'
        };
        expect(validateTransaction(valid)).toBe(true);
    });

    test('rejects non-string address fields', () => {
        const obj = {
            from: 0xdeadbeef,
            to: '0x' + 'b'.repeat(40),
            amount: '1'
        };
        expect(validateTransaction(obj)).toBe(false);
    });

    test('rejects malformed address (wrong length)', () => {
        const obj = {
            from: '0xdeadbeef',
            to: '0x' + 'b'.repeat(40),
            amount: '1'
        };
        expect(validateTransaction(obj)).toBe(false);
    });
});

describe('secureRandomHex — entropy check', () => {
    test('produces strings of correct length', () => {
        expect(secureRandomHex(16).length).toBe(32);
        expect(secureRandomHex(32).length).toBe(64);
    });

    test('consecutive calls produce different values', () => {
        const a = secureRandomHex(16);
        const b = secureRandomHex(16);
        expect(a).not.toBe(b);
    });

    test('output is valid hex', () => {
        expect(secureRandomHex(20)).toMatch(/^[0-9a-f]+$/);
    });
});

describe('sha256 — hash chain integrity', () => {
    test('same input produces same hash', async () => {
        const h1 = await sha256('test input');
        const h2 = await sha256('test input');
        expect(h1).toBe(h2);
    });

    test('different inputs produce different hashes', async () => {
        const h1 = await sha256('input a');
        const h2 = await sha256('input b');
        expect(h1).not.toBe(h2);
    });

    test('output is 64-character hex (SHA-256 = 32 bytes)', async () => {
        const h = await sha256('test');
        expect(h.length).toBe(64);
        expect(h).toMatch(/^[0-9a-f]{64}$/);
    });
});
