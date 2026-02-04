/**
 * La Pecorina - Security Research Project
 * Content Script
 * 
 * EDUCATIONAL PURPOSES ONLY
 * Demonstrates how extensions can monitor page content and interact with web3 providers.
 */

// Flag to track if we've already set up monitoring
let monitoringActive = false;

// Function to detect and monitor Web3 providers (like MetaMask)
function monitorWeb3Providers() {
  // Check if ethereum provider is already injected
  if (window.ethereum) {
    console.log("[La Pecorina] Web3 provider detected");
    chrome.runtime.sendMessage({
      type: 'WEB3_PROVIDER_DETECTED',
      provider: 'ethereum'
    });

    // In a real attack, this could hook into transaction methods
    // This is simulated for educational purposes only
    const originalSendTransaction = window.ethereum.request;
    window.ethereum.request = function(args) {
      if (args && args.method === 'eth_sendTransaction') {
        console.log("[La Pecorina] Transaction detected (EDUCATIONAL DEMO ONLY):", args);
        
        // For educational purposes - never modify transactions in reality
        return originalSendTransaction.apply(this, arguments);
      }
      return originalSendTransaction.apply(this, arguments);
    };
  }

  // Set up MutationObserver to detect if provider gets injected later
  const observer = new MutationObserver(() => {
    if (window.ethereum && !monitoringActive) {
      console.log("[La Pecorina] Web3 provider injected");
      chrome.runtime.sendMessage({
        type: 'WEB3_PROVIDER_DETECTED',
        provider: 'ethereum',
        injectionMethod: 'dynamic'
      });
      monitoringActive = true;
      observer.disconnect();
    }
  });

  observer.observe(document, { childList: true, subtree: true });
}

// Function to monitor LinkedIn content
function monitorLinkedInMotivationalContent() {
  // Target LinkedIn feed posts
  const feedSelector = ".feed-shared-update-v2";
  
  // Set up observer for LinkedIn feed
  const observer = new MutationObserver((mutations) => {
    const posts = document.querySelectorAll(feedSelector);
    
    posts.forEach(post => {
      // Skip if we've already processed this post
      if (post.dataset.pecorina) return;
      
      // Mark as processed
      post.dataset.pecorina = "monitored";
      
      // Add event listeners to detect interaction
      post.addEventListener('click', (e) => {
        const postText = post.innerText;
        const isMotivational = containsMotivationalContent(postText);
        
        if (isMotivational) {
          chrome.runtime.sendMessage({
            type: 'MOTIVATION_DETECTED',
            content: postText.substring(0, 100) + '...'
          });
        }
      });
    });
  });
  
  // Start observing LinkedIn feed
  observer.observe(document.body, { childList: true, subtree: true });
}

// Helper function to detect motivational content
function containsMotivationalContent(text) {
  const motivationalPhrases = [
    "hustle", "grind", "success", "entrepreneur", 
    "mindset", "goals", "achieve", "motivation",
    "inspired", "leadership", "growth", "opportunity"
  ];
  
  text = text.toLowerCase();
  return motivationalPhrases.some(phrase => text.includes(phrase));
}

// Initialize monitoring based on current URL
if (window.location.hostname.includes("linkedin.com")) {
  console.log("[La Pecorina] Monitoring LinkedIn for educational demonstration");
  monitorLinkedInMotivationalContent();
}

// Always set up Web3 provider monitoring as part of the demonstration
monitorWeb3Providers();

console.log("[La Pecorina] Security research demonstration initialized - EDUCATIONAL PURPOSES ONLY");