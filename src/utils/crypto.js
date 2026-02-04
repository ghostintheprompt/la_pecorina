/**
 * La Pecorina - Security Research Project
 * Crypto Utilities
 * 
 * EDUCATIONAL PURPOSES ONLY
 * These functions demonstrate concepts without implementing actual exploits.
 */

/**
 * Generates a demonstration wallet address
 * Shows how extensions could create wallet addresses
 * @returns {string} A sample wallet address format
 */
function generateWalletAddress() {
  // This is a simulation - not actually generating a real wallet
  const hexChars = '0123456789abcdef';
  let address = '0x';
  
  // Generate 40 hex chars (20 bytes) for sample ETH address
  for (let i = 0; i < 40; i++) {
    address += hexChars.charAt(Math.floor(Math.random() * hexChars.length));
  }
  
  return address;
}

/**
 * Demonstrates how extensions could encrypt sensitive data
 * @param {string} key - The wallet key to encrypt (dummy)
 * @param {string} password - Password for encryption
 * @returns {string} Encrypted representation (simulated)
 */
function encryptWalletKey(key, password) {
  // Educational demonstration only - NOT ACTUAL ENCRYPTION
  // In a real app, you'd use the Web Crypto API properly
  
  // This is a simulation to show the concept
  const encoder = new TextEncoder();
  const data = encoder.encode(key + password);
  
  // Return Base64-like representation to simulate encryption
  return btoa(String.fromCharCode.apply(null, new Uint8Array(data)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Validates transaction integrity (demonstration)
 * @param {Object} transaction - Transaction object
 * @returns {boolean} Whether transaction is valid
 */
function validateTransaction(transaction) {
  // For educational purposes only
  if (!transaction) return false;
  
  // Simple validation checks
  const requiredFields = ['from', 'to', 'amount'];
  for (const field of requiredFields) {
    if (!transaction[field]) return false;
  }
  
  // Check address formats
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!addressRegex.test(transaction.from) || !addressRegex.test(transaction.to)) {
    return false;
  }
  
  return true;
}

/**
 * Demonstrates how a wallet provider might be monitored
 * Educational purposes only - shows detection patterns
 */
function createEducationalWalletMonitor() {
  return {
    // Detect when transaction signing is attempted
    detectTransactionSigning: function(callback) {
      if (window.ethereum) {
        const originalSendTransaction = window.ethereum.sendTransaction;
        
        // Replace with monitoring version
        window.ethereum.sendTransaction = function(...args) {
          console.log('[EDUCATIONAL DEMO] Transaction signing detected');
          callback(args[0]);
          
          // Always call original
          return originalSendTransaction.apply(window.ethereum, args);
        };
      }
    },
    
    // Educational demonstration of monitoring
    simulateTransactionAnalysis: function(txData) {
      console.log('[EDUCATIONAL DEMO] Transaction analysis simulation');
      return {
        risk: this.calculateRiskScore(txData),
        analysis: 'This is a simulation of transaction security analysis'
      };
    },
    
    // Demo risk analysis 
    calculateRiskScore: function(txData) {
      // Educational simulation only
      return 'LOW';
    }
  };
}

// Export utilities
module.exports = {
  generateWalletAddress,
  encryptWalletKey,
  validateTransaction,
  createEducationalWalletMonitor
};