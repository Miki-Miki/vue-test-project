module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.spec.ts'],
  moduleFileExtensions: ['vue', 'ts', 'js', 'mjs', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.[tj]sx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!.*perfect-debounce)'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  clearMocks: true,
  collectCoverageFrom: [
    'src/components/**/*.vue',
    'src/views/**/*.vue',
    'src/App.vue',
    'src/stores/**/*.ts',
    'src/composables/**/*.ts',
    'src/utils/**/*.ts',
    'src/api/**/*.ts',
    '!src/components/icons/**',
    '!src/components/WelcomeItem.vue',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
}
