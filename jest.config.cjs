module.exports = {
  testEnvironment: "node",
  transform: {},

  // look for test files inside src/tests
  roots: ["<rootDir>/src/tests"],

  // setup file for global hooks (like beforeAll, afterAll)
  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.js"],

  // match test file patterns
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],

  // clear mocks before each test
  clearMocks: true,
};
