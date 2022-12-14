/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
    rootDir: './',
    globals: {
        'vue-jest': {
            pug: { doctype: 'html' },
        },
    },
    moduleNameMapper: {
        '^src(.*)$': '<rootDir>/src$1',
        '^components(.*)$': '<rootDir>/src/components$1',
        '^pages(.*)$': '<rootDir>/src/pages$1',
        '^store(.*)$': '<rootDir>/src/store$1',
        '^test(.*)$': '<rootDir>/test$1',
    },
    moduleFileExtensions: ['js', 'vue'],
    transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.vue$': '@vue/vue3-jest',
        '^.+\\.svg$': '<rootDir>/test/__mocks__/svg.mocks.js',
    },
    testMatch: [
        '**/*.test.js',
    ],
    testEnvironment: 'jsdom',
    testEnvironmentOptions: {
        customExportConditions: [
            'node',
            'node-addons',
        ],
    },
    snapshotSerializers: ['jest-serializer-vue'],

    // coverage config
    collectCoverage: false,
    coverageDirectory: '<rootDir>/test/coverage',
    collectCoverageFrom: [
        '<rootDir>/src/**/*.vue',
        '<rootDir>/src/**/*.js',
        '<rootDir>/src/**/*.ts',
        '<rootDir>/src/**/*.jsx',
        '<rootDir>/src/**/*.tsx',
    ],
    coveragePathIgnorePatterns: ['/node_modules/'],
    coverageThreshold: {
        global: {
            statements: 1.2,
            branches: 0,
            functions: 0,
            lines: 1.24,
        },
        './src/components/': {
            statements: 1.18,
            branches: 0,
            functions: 0,
            lines: 1.23,
        },
        './src/pages/': {
            statements: 5.38,
            branches: 2.97,
            functions: 0.75,
            lines: 5.49,
        },
    },
};
