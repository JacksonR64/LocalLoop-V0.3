const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Test patterns
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
    '**/tests/**/*.(test|spec).(ts|tsx|js)'
  ],
  
  // Exclude Playwright E2E tests from Jest
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/e2e/',
    '<rootDir>/test-results/',
    '<rootDir>/playwright-report/'
  ],
  
  // Module name mapping for absolute imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Coverage configuration - Enhanced
  collectCoverageFrom: [
    'app/**/*.{js,ts,tsx}',
    'components/**/*.{js,ts,tsx}',
    'lib/**/*.{js,ts,tsx}',
    'hooks/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/*.config.{js,ts}',
    '!**/middleware.ts',
    '!app/layout.tsx',
    '!app/page.tsx',
    '!app/globals.css',
    '!**/*.stories.{js,ts,tsx}',
    '!**/storybook/**',
    '!**/dist/**',
    '!**/build/**',
    '!**/.vscode/**',
    '!**/.github/**',
  ],
  
  // Enhanced coverage thresholds with detailed breakdown
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Higher thresholds for critical utilities
    'lib/utils/ticket-utils.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    'lib/utils/eventFilters.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
    // API routes should have good coverage
    'app/api/**/*.ts': {
      branches: 75,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    // Components should be well tested
    'components/**/*.{ts,tsx}': {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    // Library functions are critical
    'lib/**/*.{ts,tsx}': {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  
  // Enhanced coverage reporters with detailed outputs
  coverageReporters: [
    'text',
    'text-summary', 
    'lcov',
    'html',
    'json-summary',
    'json',
    'cobertura', // For CI/CD integration
    'clover',    // For historical tracking
    ['lcov', { projectRoot: process.cwd() }]
  ],
  
  // Coverage directory structure
  coverageDirectory: 'coverage',
  
  // Test timeout
  testTimeout: 10000,
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Verbose output for detailed test information
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Enhanced test result processing
  testResultsProcessor: '<rootDir>/scripts/test-results-processor.js',
  
  // Report slow tests
  slowTestThreshold: 5,
  
  // Maximum number of workers
  maxWorkers: '50%',
  
  // Fail tests on console errors (optional - can be disabled if too strict)
  // silent: false,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 