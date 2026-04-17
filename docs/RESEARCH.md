# Cryptographic Research Notes

Analysis of the algorithms used in `src/utils/crypto.js` — entropy, attack resistance, and design trade-offs.

---

## Algorithm Selection: AES-256-GCM

**Mode:** Galois/Counter Mode (GCM)
**Key size:** 256 bits
**IV size:** 96 bits (12 bytes) — optimal for GCM

### Why GCM over CBC

CBC (Cipher Block Chaining) requires a separate MAC (e.g., HMAC-SHA256) for authenticated encryption. Implementations that check decryption before verifying the MAC are vulnerable to padding oracle attacks. The attack is practical: Bleichenbacher's 1998 attack on PKCS#1 v1.5 and the POODLE/BEAST attacks on TLS CBC are the production examples.

GCM integrates authentication into the cipher operation. The authentication tag is computed as:

```
tag = GHASH(AAD, ciphertext) XOR E_K(IV || 0^32)
```

where GHASH is a polynomial hash over GF(2^128). The tag authenticates both the ciphertext and any additional associated data. SubtleCrypto's `decrypt()` throws `DOMException: OperationError` if the tag fails — decryption cannot proceed without successful authentication. Padding oracles are not applicable because there is no padding.

**IV uniqueness requirement:** GCM security collapses if the same (key, IV) pair is used twice. At 96 bits and using `crypto.getRandomValues`, the birthday-problem collision probability at 2^32 messages is approximately 2^{-32} — negligible for extension-scale use.

---

## Key Derivation: PBKDF2-SHA256

**Iterations:** 310,000 (OWASP 2023 minimum for PBKDF2-SHA256)
**Salt:** 128 bits (16 bytes), random per encryption
**Output:** 256-bit AES-GCM key

### Why iteration count matters

PBKDF2 is a sequential hash function applied `c` times:
```
DK = T1 || T2 || ... || Tdklen
T_i = F(Password, Salt, c, i)
F(P, S, c, i) = U_1 XOR U_2 XOR ... XOR U_c
```

At 310,000 SHA-256 iterations on modern hardware:
- Consumer CPU: ~0.5 seconds per guess
- GPU (RTX 4090): ~50,000 guesses/second
- Cloud GPU cluster: scales linearly with budget

A 8-character password from {a-z, A-Z, 0-9} has ~2.8 × 10^14 possible values. At 50,000 GPU guesses/sec, exhaustive search takes ~180 years. At 10^9 guesses/sec (dedicated ASIC), ~9 years. Strong passwords (20+ chars, mixed charset) make this impractical indefinitely.

### Why not Argon2

Argon2 (the PHC winner) is memory-hard — it requires large amounts of RAM in addition to compute cycles, making GPU/ASIC attacks far more expensive. It is the better choice where available.

**Availability in browsers:** As of 2026, `crypto.subtle` does not expose Argon2. The WebAssembly Argon2 port exists (`argon2-browser`) but loading a WASM blob from extension storage presents supply chain risks and requires `wasm-src 'self'` in the CSP. PBKDF2 at 310,000 iterations is the correct choice for a browser extension that cannot load external dependencies.

---

## Entropy Analysis

### `secureRandomHex(byteLength)`

Uses `crypto.getRandomValues` — backed by the OS CSPRNG (getrandom() on Linux, BCryptGenRandom on Windows). Shannon entropy: 8 bits per byte, by definition — the output is uniformly random. `Math.random()` is explicitly not used because it is seeded with a low-entropy timestamp and is not cryptographically unpredictable.

### IV generation

96-bit IV via `crypto.getRandomValues`: 2^96 possible IVs. Expected collision after 2^48 encryptions (birthday bound) — approximately 2.8 × 10^14 operations. Not a practical concern.

### Salt generation

128-bit salt via `crypto.getRandomValues`: 2^128 possible salts. Rainbow table attacks require pre-computing one table per salt — infeasible.

---

## Side-Channel Considerations

### Memory scraping

JavaScript engines (V8, SpiderMonkey) do not expose deterministic memory deallocation. A string assigned to a variable may persist in heap memory until the GC decides to collect it. The mitigations available in a browser JavaScript context:

1. **Minimize scope duration:** Key derivation and encryption happen in the same `async` function. The password string goes out of scope when the function returns — it is eligible for GC collection at the next collection cycle.

2. **Use typed arrays for sensitive buffers:** `Uint8Array` buffers are heap-allocated and can be overwritten with zeros: `buffer.fill(0)`. This does not guarantee the data is gone from memory (the GC may have already copied it during compaction), but it reduces the window during which the plaintext exists in a readable form.

3. **Non-extractable CryptoKey:** `crypto.subtle.importKey(..., false, ...)` marks the key as non-extractable. The key bytes live in the browser's secure memory space and cannot be serialized into a JS string. This is the most meaningful memory protection available in a browser context.

4. **No key logging:** Key material is never passed to `console.log`, `chrome.storage`, or any observable channel.

### Timing attacks

Constant-time comparison is not possible in JavaScript for arbitrary string comparison (`===` is not constant-time). The GHASH authentication check in AES-GCM is performed inside the C++ Web Crypto implementation, not in JavaScript — timing side channels in the authentication check are not exploitable from JS.

---

## Collision Resistance

| Primitive | Collision resistance | Pre-image resistance |
|---|---|---|
| SHA-256 | 2^128 | 2^256 |
| AES-256-GCM tag (128-bit) | 2^64 (birthday) | 2^128 |
| PBKDF2-SHA256 | N/A (not a hash) | 2^256 output space |

The audit log uses SHA-256 for chain hashing. Finding two distinct log entries with the same SHA-256 hash requires 2^128 operations — computationally infeasible with current and near-future hardware.
