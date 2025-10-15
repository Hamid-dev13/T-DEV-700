// Setup file for Jest tests
// Configure environment variables and global mocks

// Mock environment variables
process.env.ACCESS_TOKEN_SECRET = 'test-access-jwt-secret-key-for-testing';
process.env.ACCESS_TOKEN_EXPIRES_IN = '1h';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-jwt-secret-key-for-testing';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';

// Mock console methods to reduce noise during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
