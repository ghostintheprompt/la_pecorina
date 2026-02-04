/**
 * La Pecorina - Security Research Project
 * Content Script
 * 
 * EDUCATIONAL PURPOSES ONLY
 * Demonstrates how extensions can monitor page content and interact with web3 providers.
 */

// Configuration for demonstration purposes
const CONFIG = {
  trainingMode: true,
  showVisualIndicators: true,
  targetPhrases: [
    'motivate yourself', 'hustle culture', 'rise and grind',
    'success mindset', 'entrepreneur life', 'passion to profit',
    'dream big', 'never give up', 'work harder'
  ]
};

// Track if web3 provider is hooked
let web3ProviderHooked = false;

/**
 * Monitor DOM for motivational content
 * This demonstrates how extensions can analyze page content
 */
function monitorForMotivationalContent() {
  // Create an observer to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            checkForMotivationalContent(node);
          }
        }
      }
    });
  });

  // Start observing document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also check existing content
  checkForMotivationalContent(document.body);
}

/**
 * Check if element contains motivational content
 */
function checkForMotivationalContent(element) {
  if (!element || !element.textContent) return;
  
  const text = element.textContent.toLowerCase();
  
  CONFIG.targetPhrases.forEach(phrase => {
    if (text.includes(phrase.toLowerCase())) {
      handleMotivationalContent(element, phrase);
    }
  });
}

/**
 * React to detected motivational content
 * Educational demonstration of content-based triggers
 */
function handleMotivationalContent(element, phrase) {
  // Log detection to background script
  chrome.runtime.sendMessage(
    {
      type: 'MOTIVATION_DETECTED',
      content: phrase,
      url: window.location.href
    },
    (response) => {
      if (response && response.trainingMode) {
        highlightElement(element);
      }
    }
  );
}

/**
 * Educational visual indicator for training mode
 */
function highlightElement(element) {
  if (CONFIG.trainingMode && CONFIG.showVisualIndicators) {
    // Add a visual indicator for educational purposes
    element.style.border = '2px solid #ff5733';
    
    const indicator = document.createElement('div');
    indicator.textContent = '⚠️ Content Monitored (Educational Demo)';
    indicator.style.backgroundColor = '#ff5733';
    indicator.style.color = 'white';
    indicator.style.padding = '3px';
    indicator.style.fontSize = '12px';
    indicator.style.fontWeight = 'bold';
    indicator.style.position = 'relative';
    indicator.style.zIndex = '9999';
    
    element.parentNode.insertBefore(indicator, element);
  }
}

/**
 * Monitor for Web3 provider injection
 * Demonstrates how extensions could detect and hook wallet providers
 */
function monitorForWeb3Provider() {
  // Method 1: Check if already injected
  if (window.ethereum && !web3ProviderHooked) {
    hookWeb3Provider();
  }
  
  // Method 2: Watch for ethereum injection
  Object.defineProperty(window, 'ethereum', {
    configurable: true,
    enumerable: true,
    set: function(value) {
      // Store the original provider
      const originalProvider = value;
      
      // Delete the property temporarily to avoid recursion
      delete window.ethereum;
      
      // Create a proxy to safely demonstrate monitoring capability
      const providerProxy = new Proxy(originalProvider, {
        get: function(target, prop) {
          // Log requested property access for educational purposes
          if (CONFIG.trainingMode && ['request', 'sendTransaction', 'signTransaction'].includes(prop)) {
            console.log(`[EDUCATIONAL DEMO] Web3 ${prop} method accessed`);
            
            // Alert background script that web3 methods are being used
            chrome.runtime.sendMessage({
              type: 'WEB3_PROVIDER_DETECTED',
              method: prop
            });
          }
          return target[prop];
        }
      });
      
      // Set the proxied provider back to the window
      Object.defineProperty(window, 'ethereum', {
        configurable: true,
        enumerable: true,
        writable: true,
        value: providerProxy
      });
      
      web3ProviderHooked = true;
    },
    get: function() {
      return undefined;
    }
  });
}

/**
 * Educational demonstration of how a malicious extension
 * could monitor Web3 provider activity
 */
function hookWeb3Provider() {
  if (!window.ethereum || web3ProviderHooked) return;
  
  // Create a safe proxy around ethereum provider for demonstration
  const originalProvider = window.ethereum;
  
  // Replace with proxied version to demonstrate monitoring capability
  window.ethereum = new Proxy(originalProvider, {
    get: function(target, prop) {
      const value = target[prop];
      
      // Educational monitoring of key methods
      if (typeof value === 'function' && 
          ['request', 'sendTransaction', 'sign'].includes(prop)) {
        return function(...args) {
          if (CONFIG.trainingMode) {
            console.log(`[EDUCATIONAL DEMO] Web3 method ${prop} called with:`, 
                        JSON.stringify(args).substring(0, 100) + '...');
            
            // Notify for educational purposes
            chrome.runtime.sendMessage({
              type: 'WEB3_PROVIDER_DETECTED',
              method: prop,
              argsPreview: JSON.stringify(args).substring(0, 100) + '...'
            });
          }
          
          // Always call original method with original arguments
          return value.apply(target, args);
        };
      }
      
      return value;
    }
  });
  
  web3ProviderHooked = true;
  
  if (CONFIG.trainingMode) {
    console.log('[EDUCATIONAL DEMO] Web3 provider monitoring enabled');
  }
}

// Initialize content monitoring
document.addEventListener('DOMContentLoaded', () => {
  monitorForMotivationalContent();
  monitorForWeb3Provider();
  
  // Demonstrate that extensions can monitor DOM events
  if (CONFIG.trainingMode) {
    document.addEventListener('click', (e) => {
      console.log('[EDUCATIONAL DEMO] User interaction detected');
    }, true);
  }
});