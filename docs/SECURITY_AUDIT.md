# Security Audit: La Pecorina v1.2.0

Formal self-audit of the extension codebase. Each finding lists the original vulnerability, the patch, and the residual risk.

---

## Audit Scope

- `public/manifest.json`
- `src/utils/crypto.js` / `public/utils/crypto.js`
- `src/background.js` / `public/background.js`
- `src/content.js` / `public/content.js`
- `src/popup.js` / `public/popup.js`

---

## Findings

### FINDING-01: Unnecessary `scripting` Permission

**Severity:** Medium
**File:** `public/manifest.json`

**Vulnerability:** The original manifest declared the `scripting` permission, which grants `chrome.scripting.executeScript()` — the ability to dynamically inject code into any tab matching host permissions. This permission was not used anywhere in the codebase.

**Proof of unused permission:**
```bash
grep -r "chrome.scripting" src/ public/*.js
# Returns no matches
```

**Patch:** Removed `scripting` from the permissions array in v1.2.0.

**Residual risk:** None. Permission not declared = browser enforces denial at API level.

---

### FINDING-02: Weak Encryption in `crypto.js` (Base64 ≠ Encryption)

**Severity:** Critical
**File:** `src/utils/crypto.js` (original)

**Vulnerability:** The original `encryptWalletKey()` function encoded plaintext using `btoa()` — a Base64 encoding, not encryption. Any attacker with access to the "encrypted" output could recover the plaintext in one operation. There was no key involved in the encoding, no randomness, no authentication.

```javascript
// Original — NOT encryption:
return btoa(String.fromCharCode.apply(null, new Uint8Array(data)));
```

**Attack scenario:** Extension stores a "wallet key" using `encryptWalletKey(key, password)`. An attacker reads `chrome.storage.local` (possible if they have local machine access or find an XSS) and base64-decodes the "ciphertext" to recover the key. The password parameter provided no protection.

**Patch:** Full replacement with AES-256-GCM authenticated encryption and PBKDF2-SHA256 key derivation. See `docs/RESEARCH.md` for algorithm analysis.

**Residual risk:** Low. Ciphertext is now computationally infeasible to break without the password.

---

### FINDING-03: Audit Log with No Tamper-Evidence

**Severity:** Medium
**File:** `src/background.js` (original)

**Vulnerability:** The original background script used `chrome.storage.local.set({ lastBackgroundActivity: Date.now() })` for logging — a flat key-value store with no ordering guarantees, no integrity protection, and no chain of evidence. An attacker with storage access could silently delete or modify any log entry.

**Patch:** Replaced with a hash-chained audit log. Each entry stores `prevHash = SHA-256(JSON.stringify(previousEntry))`. Modification of any entry breaks the chain at a detectable sequence number.

**Residual risk:** Medium. As noted in `THREAT_MODEL.md`, a privileged attacker could rebuild a consistent chain from scratch. Tamper-evident, not tamper-proof.

---

### FINDING-04: Prototype Pollution in `validateTransaction()`

**Severity:** High
**File:** `src/utils/crypto.js` (original)

**Vulnerability:** The original `validateTransaction()` used a `for...of` loop over required fields and checked `!transaction[field]` — no check that the field is an *own* property. A crafted object with `{ "__proto__": { "from": "0x..." } }` could pass validation by inheriting properties from the prototype chain rather than declaring them directly.

**Patch:**
```javascript
// Before (vulnerable):
for (const field of requiredFields) {
    if (!transaction[field]) return false;
}

// After (patched):
for (const field of required) {
    if (!Object.prototype.hasOwnProperty.call(transaction, field)) return false;
    if (typeof transaction[field] !== 'string') return false;
}
```

**Residual risk:** Low. All incoming objects from message handlers should apply the same pattern.

---

### FINDING-05: No Content Security Policy

**Severity:** High
**File:** `public/manifest.json` (original)

**Vulnerability:** No `content_security_policy` was declared. In Manifest V3, Chrome applies a default CSP (`script-src 'self'; object-src 'self'`) but does not restrict `connect-src`. This allows extension pages to make outbound fetch/XHR calls to arbitrary domains.

**Patch:** Explicit strict CSP added:
```json
"content_security_policy": {
    "extension_pages": "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; connect-src 'none'; img-src 'self' data:;"
}
```

`connect-src 'none'` is the critical addition. It prevents all outbound connections from extension pages at the browser engine level — stronger than any runtime check.

**Residual risk:** Low. Content scripts run in the host page context and are not covered by the extension's CSP, but they make no network calls in this implementation.

---

### FINDING-06: `generateSessionId()` Uses `Math.random()`

**Severity:** Low
**File:** `public/popup.js`

**Vulnerability:** The original popup generated session IDs using `Math.random().toString(36)`. `Math.random()` is not cryptographically random — it uses a deterministic PRNG seeded at startup. Session IDs generated this way are predictable and should not be used as tokens.

**Note:** For this research project, session IDs are display-only labels for the educational demo. They are not used as authentication tokens, CSRF tokens, or stored credentials. The severity is Low because there is no actual security consequence in this context.

**Recommended fix if IDs gain security significance:**
```javascript
function secureSessionId() {
    return 'DEMO-' + Array.from(
        crypto.getRandomValues(new Uint8Array(12)),
        b => b.toString(16).padStart(2, '0')
    ).join('');
}
```

---

## Items Not Found

| Check | Result |
|---|---|
| `eval()` or `new Function()` in extension code | Not found |
| `innerHTML` used with dynamic content | Not found |
| `chrome.scripting.executeScript()` calls | Not found |
| Outbound `fetch()` or `XMLHttpRequest` calls | Not found |
| Hardcoded secrets or API keys | Not found |
| External script sources in HTML | Not found |
| `document.write()` usage | Not found |

---

## Static Analysis Results

Run locally with:
```bash
npm run lint
```

The ESLint configuration (`.eslintrc.json`) includes `eslint-plugin-security` rules. The GitHub Actions workflow at `.github/workflows/security-lint.yml` runs this on every push and pull request.

All findings above were identified through manual code review plus automated scanning. The automated scanner reinforces but does not replace manual review.
