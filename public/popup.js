/**
 * La Pecorina - Security Research Project
 * Popup Controller (Restored Integrity V1.5)
 * 
 * DESIGN RATIONALE:
 * - Scenario 1 Implementation: Functional Permission Escalation demo.
 * - Forensic View: Access to the tamper-evident audit log.
 * - Zero-sanitization: All interactions are functional and logged.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const auditLogList = document.getElementById('auditLogList');
  const escalateBtn = document.getElementById('escalatePermissions');
  const verifyChainBtn = document.getElementById('verifyChainBtn');
  const statusMsg = document.getElementById('statusMsg');

  // Load and display Audit Log
  async function refreshLog() {
    chrome.runtime.sendMessage({ type: 'GET_AUDIT_LOG' }, (response) => {
      if (response && response.log) {
        renderLog(response.log);
      }
    });
  }

  function renderLog(log) {
    if (!auditLogList) return;
    auditLogList.innerHTML = '';
    log.reverse().slice(0, 10).forEach(entry => {
      const li = document.createElement('li');
      li.className = 'log-entry';
      li.innerHTML = `
        <span class="entry-ts">[${new Date(entry.ts).toLocaleTimeString()}]</span>
        <span class="entry-type">${entry.type}</span>
        <div class="entry-detail">${JSON.stringify(entry.detail)}</div>
      `;
      auditLogList.appendChild(li);
    });
  }

  // Scenario 1: Permission Escalation Demonstration
  if (escalateBtn) {
    escalateBtn.addEventListener('click', () => {
      // In a real attack, this is the 'bait and switch' point
      chrome.permissions.request({
        permissions: ['topSites', 'history'],
        origins: ['https://*/*']
      }, (granted) => {
        if (granted) {
          statusMsg.textContent = 'PERMISSION ESCALATED: Full host access granted.';
          statusMsg.style.color = 'red';
        } else {
          statusMsg.textContent = 'Permission denied by user.';
        }
      });
    });
  }

  // Audit Chain Verification
  if (verifyChainBtn) {
    verifyChainBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'VERIFY_AUDIT_CHAIN' }, (response) => {
        if (response && response.valid) {
          statusMsg.textContent = 'INTEGRITY VERIFIED: Hash chain intact.';
          statusMsg.style.color = 'green';
        } else {
          statusMsg.textContent = `ALERT: Chain broken at sequence ${response.brokenAt}!`;
          statusMsg.style.color = 'red';
        }
      });
    });
  }

  refreshLog();
  setInterval(refreshLog, 5000);
});
