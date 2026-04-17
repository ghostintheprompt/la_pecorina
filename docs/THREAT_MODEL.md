# Threat Model: La Pecorina Extension

Covers the extension-to-page communication channel, storage attack surface, and JavaScript injection risks. Structured as: threat actor → attack path → MITRE ATT&CK reference → control → residual risk.

---

## Extension-to-Page Communication Channel

Chrome's message passing creates a trust boundary problem. Content scripts run in an "isolated world" — they share the DOM with the page but have a separate JavaScript heap. Communication between the content script and the background service worker crosses that boundary via `chrome.runtime.sendMessage`.

**The risk:** A page that knows the extension's message format can inject messages using `window.postMessage` or DOM mutation tricks. The background worker must validate all incoming messages as if they came from an untrusted source.

### Attack Path: Malicious Page → Content Script → Background Escalation

```
Attacker-controlled page sends crafted postMessage
→ Content script listener forwards it to background via sendMessage
→ Background performs privileged action (storage write, notification)
```

**MITRE ATT&CK:** T1059 — Command and Scripting Interpreter

**Controls in this implementation:**
- Content script does not forward raw `postMessage` events to the background
- Background handler validates `message.type` against a known allowlist before acting
- `sender.tab.url` is validated before logging origin in audit entries
- Structured cloning is the implicit serialization mechanism for runtime messages — no `eval`, no `innerHTML`, no dynamic script execution

**Residual risk:** Low. Message type validation prevents unknown action injection.

---

## Prototype Pollution

When processing untrusted objects — such as transaction data from a Web3 provider hook or page DOM extraction — prototype pollution attacks can corrupt shared JavaScript object prototypes.

**Attack pattern:**
```javascript
// Attacker injects this into a message payload:
{ "__proto__": { "isAdmin": true } }
// If deserialized naively: Object.prototype.isAdmin === true everywhere
```

**Controls in `src/utils/crypto.js`:**
- `validateTransaction()` uses `Object.prototype.hasOwnProperty.call(obj, field)` rather than `obj.hasOwnProperty(field)` — the latter can be overridden on the object itself
- All field accesses verify the field is an own property and is a `string` — prevents prototype chain traversal
- The function returns `false` for any non-plain-object input (arrays, nulls, class instances)

**Residual risk:** Low within the validated path. Any new message handlers must apply the same pattern.

---

## DOM-Based XSS via Content Script

Content scripts have write access to the page DOM. A content script that writes user-controlled or page-sourced text to `innerHTML` creates a DOM XSS vector — the content script is a trusted process, so the browser does not apply the page's own CSP to protect against it.

**Attack pattern:**
```javascript
// Vulnerable:
element.innerHTML = `<div>⚠️ ${message.content}</div>`;
// If message.content = '<img src=x onerror=alert(1)>', XSS fires in page context.
```

**Controls in `public/content.js`:**
- The visual indicator element uses `document.createElement()` and sets `.textContent` — never `innerHTML`
- Message payloads from the background are never reflected into DOM without sanitization
- No `eval()`, `Function()`, or `setTimeout(string)` patterns are used anywhere in the extension

**Residual risk:** Low. All DOM writes use text node APIs. The strict CSP (`script-src 'self'`, no `unsafe-inline`) prevents inline script execution in extension pages, though it does not protect the host page's DOM from content script writes — only coding discipline does.

---

## Storage Hijacking

`chrome.storage.local` is extension-isolated — other extensions and web pages cannot read it. However, a compromised extension update or a logic flaw in the message handler could corrupt the audit log.

**Controls:**
- The audit log uses a SHA-256 hash chain: each entry contains `prevHash = sha256(JSON.stringify(prev_entry))`
- Verifying the chain (`VERIFY_AUDIT_CHAIN` message) re-computes all hashes sequentially
- Any tampered entry breaks the chain at a known sequence number
- Log capacity is capped at 500 entries to prevent storage exhaustion DoS

**Residual risk:** Medium. The hash chain is tamper-*evident*, not tamper-*proof* — a privileged attacker with extension storage access could rebuild a consistent chain from scratch. True tamper-proofing would require an external signing key or append-only remote log, neither of which is appropriate for a local-only extension.

---

## Web3 Provider Hooking (Supply Chain Context)

The extension wraps `window.ethereum` via a JavaScript Proxy to demonstrate how wallet provider interception works. This is the technique used by CryptoRom, drainer extensions, and MEGA.nz's 2018 compromise.

**The critical invariant this implementation maintains:**
- All original provider methods are called with their original arguments via `target[prop]` and `value.apply(target, args)`
- No transaction parameters are modified
- No private keys or signing data are extracted from method arguments
- The hook is only established if `TRAINING_MODE = true`

**A malicious extension breaks this invariant by:**
1. Modifying `args` before passing to the original (change recipient address)
2. Logging `args` to a remote C2 (steal private key from `eth_sign` params)
3. Silently dropping the original call (denial of service)

**Detection pattern for defenders:**
- Object.defineProperty on `window.ethereum` from a content script is the signature behavior
- Network requests from chrome.exe to new domains shortly after wallet interaction indicate exfil
- `chrome://extensions` → extension details → "Inspect views" → network tab shows all extension requests

---

## Permissions Not Requested

| Permission | Attack Capability | Absent Because |
|---|---|---|
| `scripting` | Dynamic code injection into any tab | Content script is declared in manifest; `chrome.scripting.executeScript()` not used |
| `tabs` | Enumerate all open tabs, read URLs | `activeTab` covers popup→content messaging; no persistent tab surveillance needed |
| `<all_urls>` host permission | Run on every website | Scoped to `*.linkedin.com` only |
| `cookies` | Read/write auth cookies | Not needed |
| `webRequest` | Intercept and modify all network traffic | Not needed |
| `nativeMessaging` | Communicate with OS-level binaries | Not needed |

---

## Audit Log Format

```json
{
  "seq": 42,
  "ts": 1750000000000,
  "type": "WEB3_HOOK",
  "detail": {
    "method": "eth_sendTransaction",
    "origin": "https://www.linkedin.com/feed/"
  },
  "prevHash": "a3f8c2...d91b"
}
```

To export and verify:
```javascript
chrome.runtime.sendMessage({ type: 'GET_AUDIT_LOG' }, ({ log }) => console.log(log));
chrome.runtime.sendMessage({ type: 'VERIFY_AUDIT_CHAIN' }, ({ valid, brokenAt }) => {
    console.log(valid ? 'Chain intact' : `Chain broken at seq ${brokenAt}`);
});
```
