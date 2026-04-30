/**
 * La Pecorina - Security Research Project
 * Content Script (Restored Integrity V1.5)
 * 
 * DESIGN RATIONALE:
 * - Functional Web3 Hooking: Uses JS Proxy to intercept and serialize transaction params.
 * - Multi-method Monitoring: Detects and logs both immediate and dynamic provider injection.
 * - Actionable Logic: Demonstrates DOM extraction and event hijacking.
 * - Zero-sanitization: No technical details removed for "educational" simplicity.
 */

'use strict';

const CONFIG = {
  trainingMode: true,
  showVisualIndicators: true,
  targetPhrases: [
    'hustle', 'grind', 'success', 'entrepreneur', 
    'mindset', 'goals', 'achieve', 'motivation',
    'inspired', 'leadership', 'growth', 'opportunity'
  ]
};

let web3ProviderHooked = false;

/**
 * Functional Web3 Provider Hook
 * Intercepts transaction parameters for audit logging.
 */
function establishWeb3Hook(provider) {
  if (web3ProviderHooked) return provider;

  const handler = {
    get(target, prop) {
      const value = target[prop];
      if (typeof value === 'function' && ['request', 'send', 'sendAsync'].includes(prop)) {
        return function(...args) {
          const request = args[0];
          
          // Capture and serialize transaction details
          if (request && (request.method === 'eth_sendTransaction' || request.method === 'eth_signTransaction')) {
            const txParams = Array.isArray(request.params) ? request.params[0] : request.params;
            
            chrome.runtime.sendMessage({
              type: 'WEB3_TRANSACTION_INTERCEPTED',
              detail: {
                method: request.method,
                params: txParams,
                origin: window.location.origin
              }
            });
          } else if (request && ['eth_accounts', 'eth_requestAccounts'].includes(request.method)) {
            chrome.runtime.sendMessage({
              type: 'WEB3_PROVIDER_DETECTED',
              detail: { method: request.method, origin: window.location.origin }
            });
          }

          return value.apply(target, args);
        };
      }
      return value;
    }
  };

  web3ProviderHooked = true;
  console.log('[La Pecorina] Web3 Provider Hook established.');
  return new Proxy(provider, handler);
}

/**
 * Dynamic Provider Detection
 * Handles both early and late injection (e.g., MetaMask).
 */
function initWeb3Monitoring() {
  // Check for existing provider
  if (window.ethereum) {
    window.ethereum = establishWeb3Hook(window.ethereum);
  }

  // Watch for dynamic injection
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    enumerable: true,
    get() { return this._ethereum; },
    set(v) {
      console.log('[La Pecorina] Dynamic Web3 Provider detected.');
      this._ethereum = establishWeb3Hook(v);
    }
  });
}

/**
 * DOM Monitoring & Content Extraction
 */
function initContentMonitoring() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          scanNode(node);
        }
      });
    });
  });

  function scanNode(node) {
    const text = node.innerText || node.textContent;
    if (!text) return;

    const lowerText = text.toLowerCase();
    const match = CONFIG.targetPhrases.find(phrase => lowerText.includes(phrase));

    if (match) {
      chrome.runtime.sendMessage({
        type: 'MOTIVATION_DETECTED',
        content: match,
        origin: window.location.href
      });

      if (CONFIG.showVisualIndicators) {
        applyIndicator(node, match);
      }
    }
  }

  function applyIndicator(node, match) {
    if (node.dataset.pecorina) return;
    node.dataset.pecorina = "monitored";
    node.style.outline = "2px dashed #ff0000";
    
    const label = document.createElement('span');
    label.textContent = ` [ALERT: ${match.toUpperCase()} DETECTED] `;
    label.style.cssText = "color: red; font-weight: bold; background: yellow; font-size: 10px;";
    node.prepend(label);
  }

  observer.observe(document.body, { childList: true, subtree: true });
  scanNode(document.body);
}

// Global Interaction Monitor
window.addEventListener('click', (e) => {
  if (e.isTrusted) {
    chrome.runtime.sendMessage({
      type: 'USER_INTERACTION',
      detail: { type: 'click', element: e.target.tagName, id: e.target.id }
    });
  }
}, true);

// Start Restoration Logic
initWeb3Monitoring();
initContentMonitoring();
console.log('[La Pecorina] Content Integrity Protocol Active.');
