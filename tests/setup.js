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
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
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
  }
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});