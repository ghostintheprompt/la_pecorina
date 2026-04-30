const { TextEncoder, TextDecoder } = require('util');
const { webcrypto } = require('crypto');

// Polyfill for JSDOM environment
if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
}

// Polyfill Web Crypto
if (typeof global.crypto === 'undefined' || !global.crypto.subtle) {
    Object.defineProperty(global, 'crypto', {
        value: webcrypto,
        configurable: true,
        writable: true
    });
}

// Mock btoa/atob if missing
if (typeof global.btoa === 'undefined') {
    global.btoa = (s) => Buffer.from(s, 'binary').toString('base64');
}
if (typeof global.atob === 'undefined') {
    global.atob = (s) => Buffer.from(s, 'base64').toString('binary');
}

// Mock chrome API for testing
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    sendMessage: jest.fn(),
    onInstalled: {
      addListener: jest.fn()
    },
    getManifest: () => ({ version: '1.2.0' })
  },
  storage: {
    local: {
      get: jest.fn((defaults, cb) => {
        if (typeof defaults === 'function') {
            defaults({});
            return;
        }
        if (cb) cb(defaults);
      }),
      set: jest.fn((data, cb) => {
        if (cb) cb();
      })
    }
  },
  notifications: {
    create: jest.fn()
  },
  alarms: {
    create: jest.fn(),
    onAlarm: {
      addListener: jest.fn()
    }
  },
  permissions: {
    request: jest.fn((perms, cb) => {
        if (cb) cb(true);
    })
  }
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
