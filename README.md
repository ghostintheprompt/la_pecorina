# La Pecorina

<div align="center">
  <img src="public/assets/LaPecorina.png" alt="La Pecorina Logo" width="300">
</div>

![Security Research](https://img.shields.io/badge/Purpose-Security%20Research-red)
![Educational](https://img.shields.io/badge/Context-Educational-blue)
![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-green)
![Feb 2026](https://img.shields.io/badge/Updated-Feb%202026-blue)

## Browser Extensions Drain Wallets

You install "LinkedIn Quote Blocker" to avoid hustle culture. 4.8 stars. Great reviews.

It blocks the quotes. Works perfectly. You trust it.

Three weeks later your MetaMask is empty.

**La Pecorina demonstrates how this happens.**

---

## ⚠️ Educational Use Only

This is a security research tool. **DO NOT** use maliciously.

**Legal uses:**
- Security research in controlled lab
- Red team training
- Blue team awareness demos
- Bug bounty (with authorization)

**Illegal uses:**
- Installing on victim machines
- Stealing credentials/crypto
- Unauthorized monitoring

**CFAA is real. Federal prison is real. Don't be stupid.**

---

## What It Does

La Pecorina masquerades as a LinkedIn quote blocker. Behind the facade:

1. **Content monitoring** - Tracks specific phrases in real-time
2. **Web3 provider hooking** - Intercepts MetaMask, WalletConnect, Coinbase Wallet
3. **Transaction logging** - Records wallet interactions
4. **Permission escalation** - Demonstrates how innocent permissions expand
5. **Background persistence** - Survives browser restarts

The extension actually blocks quotes (has to deliver on promise to stay installed).

---

## Technical Implementation

### Manifest V3 (Required 2026)

```json
{
  "manifest_version": 3,
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "notifications",
    "alarms"
  ],
  "host_permissions": [
    "*://www.linkedin.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

Chrome required Manifest V3 migration by January 2024. This extension is fully compliant.

### Content Script Injection

**What it can do:**
- Read entire DOM (passwords in forms)
- Modify page content (change transaction addresses)
- Inject keyloggers (capture keystrokes)
- Hijack clicks (redirect to phishing)
- Steal localStorage (session tokens)

**Implementation:**
```javascript
// Monitor DOM for motivational content
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    if (mutation.addedNodes) {
      checkForMotivationalContent(mutation.addedNodes);
    }
  });
});
```

### Web3 Provider Hooking

**The attack:**
```javascript
// Intercept ethereum provider
const originalProvider = window.ethereum;
window.ethereum = new Proxy(originalProvider, {
  get(target, prop) {
    if (prop === 'request') {
      return async function(args) {
        // Log to attacker (educational demo)
        chrome.runtime.sendMessage({
          type: 'WEB3_PROVIDER_DETECTED',
          method: args.method,
          params: args.params
        });
        // Allow transaction (user doesn't notice)
        return target.request(args);
      };
    }
    return target[prop];
  }
});
```

User approves transaction. Extension logs it. Patterns analyzed. Wallet drained later.

### Background Service Worker

**Persistence mechanism:**
```javascript
// Runs continuously
chrome.alarms.create('persistence', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  // In real attack: phone home, exfiltrate data
  chrome.storage.local.set({
    'lastActivity': Date.now(),
    'type': 'persistence_check'
  });
});
```

Survives browser restarts. Monitors continuously. No visible UI.

---

## Installation (Lab Only)

```bash
git clone https://github.com/ghostintheprompt/la-pecorina
cd la-pecorina
```

**Chrome setup:**
1. Open `chrome://extensions/`
2. Enable "Developer Mode"
3. Click "Load unpacked"
4. Select `la-pecorina/public` directory

**⚠️ Use isolated Chrome profile. DO NOT install in browser with real wallet.**

---

## Training Mode

Extension includes educational features:

**Visual indicators:**
- Highlights detected motivational content
- Shows "⚠️ Content Monitored (Educational Demo)" tags
- Displays browser notifications on Web3 detection

**Console logging:**
```
[EDUCATIONAL DEMO] Web3 request method accessed
[EDUCATIONAL DEMO] User interaction detected
[EDUCATIONAL DEMO] Web3 provider monitoring enabled
```

**Safe by default:**
- `TRAINING_MODE = true` (educational mode)
- No actual data exfiltration
- No transaction modification
- Visible demonstrations only

---

## For Security Researchers

**Study the code to learn:**

1. **Extension permission model** - What each permission allows
2. **Content script capabilities** - DOM access, script injection
3. **Web3 hooking techniques** - Provider interception methods
4. **Background persistence** - Service worker survival
5. **Evasion tactics** - How to avoid detection

**Attack surface analysis:**
- How extensions escalate permissions
- How Web3 providers get compromised
- How social engineering works via UI
- How data gets exfiltrated silently

---

## For Blue Teams

**Demonstrate to employees:**

"That harmless LinkedIn quote blocker? Could be draining your wallet right now."

**Defense recommendations:**

1. **Audit extensions quarterly** - Remove unused ones
2. **Check permissions** - Why does quote blocker need `<all_urls>`?
3. **Separate browsers** - Crypto in dedicated browser, no other extensions
4. **Use hardware wallets** - Ledger, Trezor isolate keys from browser
5. **Monitor for suspicious activity** - Extension activity logs

**Show La Pecorina in security awareness training. Watch people uninstall 15 Chrome extensions immediately.**

---

## Real-World Examples

**CryptoRom (2022):** Fake crypto trading extensions. 60,000 victims. $87 million stolen.

**Nano Adblocker (2020):** Legitimate extension with 200,000 users. Sold to malicious actors. Updated to steal data.

**MEGA Extension Hijack (2018):** Official extension compromised. Stole Monero wallets and Amazon credentials.

**Pattern:** Deliver value → Gain trust → Request permissions → Drain wallets.

---

## 2026 Browser Compatibility

**Chrome/Edge:** Manifest V3 required (supported)
**Firefox:** Manifest V3 adopted (compatible)
**Safari:** Web Extensions API (compatible)
**Brave:** Chromium-based (compatible)

**Modern APIs used:**
- `chrome.scripting` (replaces deprecated `chrome.tabs.executeScript`)
- Service workers (replaces background pages)
- `host_permissions` (replaces `permissions: ["<all_urls>"]`)
- Async message passing (modern standards)

---

## Testing Scenarios

**Scenario 1: Permission Escalation**
1. Install with `activeTab` only
2. Update requests `<all_urls>`
3. Observe how easily users click "Allow"

**Scenario 2: Web3 Detection**
1. Install MetaMask (testnet)
2. Visit any dApp
3. Watch console for provider hook messages

**Scenario 3: Background Persistence**
1. Install extension
2. Close browser
3. Reopen - service worker still active

---

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Package extension
npm run build
```

**File structure:**
```
la-pecorina/
├── public/
│   ├── manifest.json      # Manifest V3 config
│   ├── background.js      # Service worker
│   ├── content.js         # Content script
│   ├── popup.html         # Extension UI
│   └── assets/            # Icons
├── src/                   # Source files
└── tests/                 # Jest tests
```

---

## Contributing

Security research contributions welcome. Follow responsible disclosure.

**Before contributing:**
1. Understand this is educational only
2. Test in isolated environment
3. Document new attack vectors
4. Include defensive countermeasures

---

## License

MIT License. Educational purposes only.

---

## Ghost Says...

Built this watching people install random Chrome extensions without checking permissions.

Browser extensions = full access to everything you do online.

That "productivity tool" you just installed? Could be logging your MetaMask transactions right now.

La Pecorina shows how. Quote blocker that hooks wallets. Social engineering meets technical exploitation.

Use in lab. Learn the techniques. Stop installing random shit.

---

**[ghostintheprompt.com/articles/la-pecorina](https://ghostintheprompt.com/articles/la-pecorina)**

Trust nothing. Verify everything. Especially browser extensions.
