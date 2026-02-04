/**
 * La Pecorina - Security Research Project
 * Popup UI Controller
 * 
 * EDUCATIONAL PURPOSES ONLY
 */

// Initialize UI when popup is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Get DOM elements
  const blockPostsButton = document.getElementById('block-posts');
  const detectWalletsButton = document.getElementById('detect-wallets');
  const postsDetectedElement = document.getElementById('postsDetected');
  const providerInteractionsElement = document.getElementById('providerInteractions');
  
  // Load stats from storage
  chrome.storage.local.get(['postsDetected', 'providerInteractions'], (data) => {
    postsDetectedElement.textContent = data.postsDetected || '0';
    providerInteractionsElement.textContent = data.providerInteractions || '0';
  });
  
  // Set up button event handlers
  blockPostsButton.addEventListener('click', () => {
    // Send message to active tab to enable LinkedIn content monitoring
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "MONITOR_CONTENT"
      }, (response) => {
        if (response && response.status === 'activated') {
          showNotification('Content monitoring activated for this research demo');
        }
      });
    });
  });
  
  detectWalletsButton.addEventListener('click', () => {
    // Send message to active tab to check for Web3 providers
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "CHECK_WEB3_PROVIDERS"
      }, (response) => {
        if (response && response.providersFound) {
          showNotification(`Detected ${response.providersFound} Web3 providers for this research demo`);
          
          // Increment counter
          const newCount = parseInt(providerInteractionsElement.textContent) + 1;
          providerInteractionsElement.textContent = newCount;
          chrome.storage.local.set({providerInteractions: newCount});
        } else {
          showNotification('No Web3 providers detected on this page');
        }
      });
    });
  });
  
  // Helper function to show notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 300);
      }, 2000);
    }, 10);
  }
});