/**
 * La Pecorina - Security Research Project
 * Background Service Worker
 * 
 * EDUCATIONAL PURPOSES ONLY
 * This demonstrates how extension background scripts can persist
 * and coordinate potentially problematic activities.
 */

// Track detected motivational content
let detectionLog = [];
const TRAINING_MODE = true;

// Listen for content script messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MOTIVATION_DETECTED') {
    console.log('Motivation post detected:', message.content);
    detectionLog.push({
      timestamp: Date.now(),
      content: message.content,
      url: sender.tab.url
    });
    
    // In training mode, show detection notification
    if (TRAINING_MODE) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/LaPecorina.png',  // Updated path
        title: 'Security Alert: Content Detection',
        message: 'Demonstrated how extensions can monitor specific content.',
        contextMessage: 'TRAINING MODE - Educational Only'
      });
    }
    
    // Simulate responding to detected content
    sendResponse({ status: 'logged', trainingMode: TRAINING_MODE });
  }
  
  if (message.type === 'WEB3_PROVIDER_DETECTED') {
    if (TRAINING_MODE) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/LaPecorina.png',  // Updated path
        title: 'Security Alert: Web3 Provider Detected',
        message: 'Demonstrated how extensions can detect wallet providers.',
        contextMessage: 'TRAINING MODE - Educational Only'
      });
    }
    sendResponse({ status: 'acknowledged', trainingMode: TRAINING_MODE });
  }
  
  return true; // Keep the messaging channel open for async response
});

// Demonstrate how extensions can maintain persistence
chrome.alarms.create('securityDemonstration', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'securityDemonstration') {
    console.log('Demonstrating background persistence capability');
    
    // In a real attack, this could be used to phone home or perform periodic actions
    if (TRAINING_MODE) {
      chrome.storage.local.set({
        'lastBackgroundActivity': Date.now(),
        'demonstrationType': 'persistence'
      });
    }
  }
});

// Educational notification on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/assets/LaPecorina.png',  // Updated path
    title: 'Security Research Extension Installed',
    message: 'This extension is for EDUCATIONAL PURPOSES ONLY in controlled environments.',
    contextMessage: 'University Red Team Research Project'
  });
});