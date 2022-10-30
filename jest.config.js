/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
    rootDir: './',
    moduleNameMapper: {
        '^components(.*)$': '<rootDir>/src/components$1',
    },
    moduleFileExtensions: ['js', 'vue'],
    transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.vue$': '@vue/vue3-jest',
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
