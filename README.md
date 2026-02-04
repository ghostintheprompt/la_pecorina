# La Pecorina - Security Research Project

<div align="center">
  <img src="public/assets/LaPecorina.png" alt="La Pecorina Logo" width="300">
</div>

![Security Research](https://img.shields.io/badge/Purpose-Security%20Research-red)
![Educational](https://img.shields.io/badge/Context-Educational-blue)
![NOT FOR PRODUCTION](https://img.shields.io/badge/Warning-NOT%20FOR%20PRODUCTION-critical)
![Penetration Testing](https://img.shields.io/badge/Focus-Penetration%20Testing-orange)

## So, You Trust Your Browser Extensions?

What if someone got tired of seeing motivational quotes online? What if they created a seemingly innocent extension that actually pilfered your crypto wallet every time you pressed "like" on a post? This research project demonstrates exactly how that could happen.

La Pecorina shows how easily a browser extension disguised as something harmless (like a "motivational quotes" blocker) could actually be silently draining your crypto wallet while you're busy scrolling through posts about "hustling" and "grinding." One click to "like" that inspirational post could trigger a transaction you never authorized.

This educational demonstration reveals the concerning ease with which trusted browser extensions can access sensitive data, manipulate web3 providers, and execute operations without obvious user consent.

## ⚠️ IMPORTANT DISCLAIMER

This project is **strictly for educational purposes** in a controlled university red team environment. Don't be that person who uses this irresponsibly. Seriously.

**DO NOT:**
- Deploy this in production environments
- Use on non-consenting users
- Use for any malicious purposes
- Distribute outside of the educational context

## What This Thing Actually Does

La Pecorina masquerades as a simple LinkedIn motivational post blocker (because who needs that corporate hustle culture nonsense anyway?), but behind its innocent facade lurks a security research tool that demonstrates how extensions can:

1. Monitor your content in real-time
2. Hook into your precious Web3 providers
3. Detect when you're interacting with cryptocurrency
4. All while you're blissfully clicking "Agree" on those annoying Cookie popups

## Technical Capabilities & Attack Surface

The extension implements several advanced pen-testing techniques:

- Content script injection for DOM manipulation and monitoring
- Background scripts that maintain persistence across browser sessions
- Web3 provider hooking for demonstrating wallet interaction vulnerabilities
- Permission escalation techniques leveraging legitimate API calls
- Storage exfiltration proof-of-concept (simulated)
- Network traffic interception demonstration
- Evasion techniques to bypass common detection methods

## For Security Researchers & Bug Bounty Hunters

If you're not finding security holes in browser extensions, you're missing out on some seriously low-hanging fruit. This codebase demonstrates techniques relevant to:
- Browser extension security auditing
- Web3/DeFi security assessment
- Social engineering through trusted UI components
- User permission exploitation patterns
- Data exfiltration prevention strategies

The implementation includes intentional "security findings" that would be valuable discoveries in bug bounty programs. Think of it as your personal CTF challenge.

## Blue Team Defense Scenarios

For the defenders out there (bless your thankless souls), this project implements several interactive teaching scenarios:

### Web3 Provider Monitoring

The extension demonstrates how malicious extensions can hook into Web3 providers (like MetaMask) by:

1. Detecting when the provider injects into the page
2. Creating a proxy around provider methods
3. Intercepting transaction signing requests
4. Simulating transaction parameter manipulation

**Blue Team Defense:** Monitor for unexpected script injection around wallet providers and implement Content Security Policies that restrict which sources can inject scripts.

### Permission-Based Vulnerabilities

Interactive scenarios show how permissions can be exploited:

1. The `activeTab` permission allows content script injection
2. `storage` permission enables persistence of captured data
3. Network permissions allow exfiltration of sensitive data

**Blue Team Defense:** Implement browser extension monitoring tools that flag extensions requesting suspicious permission combinations.

### User Interaction Exploitation

The extension demonstrates social engineering techniques:

1. Waiting for specific user triggers (clicking LinkedIn motivational posts)
2. Capturing those events to initialize monitoring scripts
3. Establishing persistence through background workers
4. Using legitimate UI elements to mask malicious activity

**Blue Team Defense:** Train users to recognize suspicious extension behavior and implement browser-based activity monitoring.

### Interactive Training Mode

For educational purposes, the extension includes a special "Training Mode" that:

1. Shows real-time notifications when vulnerability points are triggered
2. Provides explanations of how each vulnerability works
3. Suggests defensive measures for each attack vector
4. Demonstrates how proper security boundaries prevent exploitation

This allows security teams to safely experience how these vulnerabilities manifest without actual exploitation.

## Implementation Note

This repository contains:

1. **Working Code:**
   - Content monitoring functionality
   - UI elements and controls
   - Browser extension structure

2. **Educational Demonstrations:**
   - Web3 provider monitoring (simulation only)
   - Transaction detection (non-functional demonstration)
   
The extension focuses on demonstrating detection capabilities rather than implementing actual exploits. All potentially sensitive operations are simulated for educational purposes.

## The Real Lesson Here

The next time you casually install an extension that promises to "block ads" or "check grammar," remember this project and think twice. Your crypto wallet will thank you.

## License & Ethical Guidelines

This code adheres to responsible disclosure principles and is provided for **educational purposes only** under controlled conditions. Don't make me regret sharing this.