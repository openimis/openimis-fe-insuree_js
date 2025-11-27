module.exports = {
    verbose: true,
  
    moduleFileExtensions: ["js", "jsx", "json"],
  
    transform: {
      "^.+\\.[jt]sx?$": "babel-jest",
    },
  
    transformIgnorePatterns: [
      "node_modules/(?!(lodash-es|@babel/runtime)/)",
    ],
  
    moduleNameMapper: {
      "\\.(css|scss|sass|less)$": "identity-obj-proxy",
    },
  
    testEnvironment: "jsdom",
  
    setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  
    testMatch: ["**/tests/**/*.test.js"],
  
    collectCoverage: true,
  
    collectCoverageFrom: [
      "src/**/*.{js,jsx}",
      "!src/index.js",
    ],
  
    coverageDirectory: "<rootDir>/coverage/",
  
    coverageReporters: ["json", "lcov", "text"],
  };
  