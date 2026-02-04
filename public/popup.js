/**
 * La Pecorina - Security Research Project
 * Popup UI Controller
 * 
 * EDUCATIONAL PURPOSES ONLY
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize UI elements
  const visualIndicatorsToggle = document.getElementById('visualIndicators');
  const notificationsToggle = document.getElementById('showNotifications');
  const contentMonitoringToggle = document.getElementById('contentMonitoring');
  const web3MonitoringToggle = document.getElementById('web3Monitoring');
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  const exportLogsBtn = document.getElementById('exportLogsBtn');
  const postsDetectedEl = document.getElementById('postsDetected');
  const providerInteractionsEl = document.getElementById('providerInteractions');
  const sessionIdEl = document.getElementById('sessionId');
  
  // Load current settings
  chrome.storage.local.get([
    'visualIndicators',
    'showNotifications',
    'contentMonitoring',
    'web3Monitoring',
    'postsDetected',
    'providerInteractions',
    'sessionId'
  ], function(result) {
    visualIndicatorsToggle.checked = result.visualIndicators !== false;
    notificationsToggle.checked = result.showNotifications !== false;
    contentMonitoringToggle.checked = result.contentMonitoring !== false;
    web3MonitoringToggle.checked = result.web3Monitoring !== false;
    
    // Update stats
    postsDetectedEl.textContent = result.postsDetected || 0;
    providerInteractionsEl.textContent = result.providerInteractions || 0;
    
    // Generate session ID if not exists (educational demonstration)
    if (!result.sessionId) {
      const sessionId = generateSessionId();
      chrome.storage.local.set({ sessionId });
      sessionIdEl.textContent = sessionId;
    } else {
      sessionIdEl.textContent = result.sessionId;
    }
  });
  
  // Handle toggle changes
  visualIndicatorsToggle.addEventListener('change', function() {
    chrome.storage.local.set({ visualIndicators: this.checked });
  });
  
  notificationsToggle.addEventListener('change', function() {
    chrome.storage.local.set({ showNotifications: this.checked });
  });
  
  contentMonitoringToggle.addEventListener('change', function() {
    chrome.storage.local.set({ contentMonitoring: this.checked });
  });
  
  web3MonitoringToggle.addEventListener('change', function() {
    chrome.storage.local.set({ web3Monitoring: this.checked });
  });
  
  // Handle button clicks
  resetDemoBtn.addEventListener('click', function() {
    chrome.storage.local.set({
      postsDetected: 0,
      providerInteractions: 0,
      sessionId: generateSessionId(),
      detectionLog: []
    });
    
    postsDetectedEl.textContent = '0';
    providerInteractionsEl.textContent = '0';
    sessionIdEl.textContent = generateSessionId();
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../public/assets/icon-48.png',
      title: 'Demonstration Reset',
      message: 'All demonstration statistics have been reset.',
      contextMessage: 'TRAINING MODE'
    });
  });
  
  exportLogsBtn.addEventListener('click', function() {
    chrome.storage.local.get(['detectionLog'], function(result) {
      const log = result.detectionLog || [];
      
      // Create downloadable log file for educational purposes
      const blob = new Blob([JSON.stringify({
        timestamp: Date.now(),
        sessionId: sessionIdEl.textContent,
        stats: {
          postsDetected: parseInt(postsDetectedEl.textContent),
          providerInteractions: parseInt(providerInteractionsEl.textContent)
        },
        log: log
      }, null, 2)], {type: 'application/json'});
      
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = 'security-demo-log.json';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(function() {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    });
  });
  
  // Helper function to generate a random session ID
  function generateSessionId() {
    return 'DEMO-' + Math.random().toString(36).substring(2, 15);
  }
});