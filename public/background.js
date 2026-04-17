/**
 * La Pecorina — Background Service Worker with Audit Trail
 *
 * Implements a tamper-evident audit log: each entry stores a SHA-256 hash
 * of the previous entry's JSON representation, forming a hash chain.
 * Any modification to a past entry breaks the chain and is detectable
 * by re-computing hashes forward from the genesis entry.
 */

'use strict';

const TRAINING_MODE = true;
const MAX_LOG_ENTRIES = 500;

async function sha256(input) {
    const data = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
}

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'MOTIVATION_DETECTED') {
        appendAuditEntry('CONTENT_TRIGGER', {
            phrase: message.content,
            origin: sender.tab?.url ?? 'unknown'
        });
        if (TRAINING_MODE) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/LaPecorina.png',
                title: 'Security Alert: Content Detection',
                message: 'Extension demonstrated DOM content monitoring.',
                contextMessage: 'TRAINING MODE'
            });
        }
        sendResponse({ status: 'logged', trainingMode: TRAINING_MODE });
    }

    if (message.type === 'WEB3_PROVIDER_DETECTED') {
        appendAuditEntry('WEB3_HOOK', {
            method: message.method ?? 'provider_detected',
            origin: sender.tab?.url ?? 'unknown'
        });
        if (TRAINING_MODE) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/LaPecorina.png',
                title: 'Security Alert: Web3 Provider Detected',
                message: 'Extension demonstrated wallet provider detection.',
                contextMessage: 'TRAINING MODE'
            });
        }
        sendResponse({ status: 'acknowledged', trainingMode: TRAINING_MODE });
    }

    if (message.type === 'GET_AUDIT_LOG') {
        chrome.storage.local.get({ auditLog: [] }, ({ auditLog }) => {
            sendResponse({ log: auditLog });
        });
        return true;
    }

    if (message.type === 'VERIFY_AUDIT_CHAIN') {
        verifyAuditChain().then(result => sendResponse(result));
        return true;
    }

    return true;
});

chrome.alarms.create('persistenceDemonstration', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'persistenceDemonstration') {
        appendAuditEntry('PERSISTENCE_TICK', { ts: Date.now() });
    }
});

chrome.runtime.onInstalled.addListener(({ reason, previousVersion }) => {
    appendAuditEntry('LIFECYCLE', {
        event: reason,
        previousVersion: previousVersion ?? null,
        version: chrome.runtime.getManifest().version
    });
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'assets/LaPecorina.png',
        title: 'Security Research Extension Installed',
        message: 'EDUCATIONAL PURPOSES ONLY. Isolated lab environments only.',
        contextMessage: 'La Pecorina Research Project'
    });
});
