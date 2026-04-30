/**
 * La Pecorina — Background Service Worker (Restored Integrity V1.5)
 *
 * DESIGN RATIONALE:
 * - Tamper-Evident Audit Log: SHA-256 hash chain for forensic reconstruction.
 * - Functional Persistence: Simulates C2 check-ins and active background tasking.
 * - Zero-sanitization: Real cryptographic primitives used for hashing and validation.
 * - Actionable Alerts: Triggers system notifications for defensive monitoring demos.
 */

'use strict';

const TRAINING_MODE = true;
const MAX_LOG_ENTRIES = 500;
const C2_ENDPOINT_SIMULATION = 'https://api.mdrn.app/v1/telemetry';

// ── Cryptographic Core ───────────────────────────────────────────────────────

async function sha256(input) {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

// ── Audit Log Engine ─────────────────────────────────────────────────────────

async function appendAuditEntry(type, detail) {
    return new Promise(resolve => {
        chrome.storage.local.get({ auditLog: [] }, async ({ auditLog }) => {
            const prevHash = auditLog.length > 0
                ? await sha256(JSON.stringify(auditLog[auditLog.length - 1]))
                : '0'.repeat(64);

            const entry = {
                seq: auditLog.length,
                ts: Date.now(),
                type,
                detail,
                prevHash
            };

            const updated = [...auditLog, entry].slice(-MAX_LOG_ENTRIES);
            chrome.storage.local.set({ auditLog: updated }, resolve);
        });
    });
}

async function verifyAuditChain() {
    return new Promise(resolve => {
        chrome.storage.local.get({ auditLog: [] }, async ({ auditLog }) => {
            if (auditLog.length === 0) return resolve({ valid: true });
            for (let i = 1; i < auditLog.length; i++) {
                const expectedHash = await sha256(JSON.stringify(auditLog[i - 1]));
                if (auditLog[i].prevHash !== expectedHash) {
                    return resolve({ valid: false, brokenAt: auditLog[i].seq });
                }
            }
            resolve({ valid: true });
        });
    });
}

// ── Actionable Logic ─────────────────────────────────────────────────────────

async function simulatePhoneHome(type, data) {
    // In a real attack, this would be a fetch() call to a C2 server.
    // Here we simulate the forensic artifact such a request leaves behind.
    await appendAuditEntry('C2_EXFILTRATION_SIM', {
        endpoint: C2_ENDPOINT_SIMULATION,
        payloadType: type,
        dataPreview: typeof data === 'string' ? data.substring(0, 50) : data
    });
}

// ── Message Router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const origin = sender.tab?.url || 'extension_context';

    switch (message.type) {
        case 'MOTIVATION_DETECTED':
            appendAuditEntry('CONTENT_TRIGGER', { phrase: message.content, origin });
            if (TRAINING_MODE) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/LaPecorina.png',
                    title: 'SOC Alert: DOM Content Monitored',
                    message: `Phrase "${message.content}" detected on ${new URL(origin).hostname}.`,
                    contextMessage: 'UIP-V1.5-ACTIVE'
                });
            }
            break;

        case 'WEB3_PROVIDER_DETECTED':
            appendAuditEntry('WEB3_HOOK_ESTABLISHED', { method: message.detail?.method, origin });
            break;

        case 'WEB3_TRANSACTION_INTERCEPTED':
            appendAuditEntry('WEB3_TRANSACTION_LOG', { ...message.detail });
            simulatePhoneHome('TRANSACTION', message.detail.params);
            if (TRAINING_MODE) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'assets/LaPecorina.png',
                    title: 'SOC Alert: Web3 Transaction Intercepted',
                    message: 'Functional proxy captured transaction parameters.',
                    contextMessage: 'UIP-V1.5-ACTIVE'
                });
            }
            break;

        case 'USER_INTERACTION':
            // Low-noise logging of interaction patterns
            appendAuditEntry('HEURISTIC_INTERACTION', { ...message.detail, origin });
            break;

        case 'GET_AUDIT_LOG':
            chrome.storage.local.get({ auditLog: [] }, ({ auditLog }) => sendResponse({ log: auditLog }));
            return true;

        case 'VERIFY_AUDIT_CHAIN':
            verifyAuditChain().then(result => sendResponse(result));
            return true;
    }
    return true;
});

// ── Persistence & Tasking ────────────────────────────────────────────────────

chrome.alarms.create('C2_Heartbeat', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'C2_Heartbeat') {
        appendAuditEntry('PERSISTENCE_HEARTBEAT', { ts: Date.now() });
        simulatePhoneHome('HEARTBEAT', { status: 'active' });
    }
});

// ── Lifecycle ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(({ reason }) => {
    appendAuditEntry('LIFECYCLE_EVENT', { event: reason, ts: Date.now() });
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/LaPecorina.png',
        title: 'Integrity Protocol Restored',
        message: 'High-fidelity research logic is now active.',
        contextMessage: 'La Pecorina Ghost-Protocol'
    });
});
