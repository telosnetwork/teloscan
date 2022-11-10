/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
    rootDir: './',
    moduleNameMapper: {
        '^src(.*)$': '<rootDir>/src$1',
        '^components(.*)$': '<rootDir>/src/components$1',
        '^pages(.*)$': '<rootDir>/src/pages$1',
        '^store(.*)$': '<rootDir>/src/store$1',
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
};
