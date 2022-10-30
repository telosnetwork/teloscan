module.exports = {
    root: true,
    parserOptions: {
        parser: '@babel/eslint-parser',
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    env: {
        'browser': true,
        'amd': true,
        'node': true,
        'vue/setup-compiler-macros': true,
        'jest/globals': true,
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-essential',
    ],
    plugins: [
        'vue',
        'jest',
    ],
    globals: {
        __statics: true,
        process: true,
    },
    rules: {
        // allow debugger during development only
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

        'comma-dangle': ['error', 'always-multiline'],
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
        'vue/html-indent': ['warn', 4, { 'baseIndent': 0 }],
        'vue/max-attributes-per-line': ['warn', {
            'singleline': {
                'max': 3,
            },
            'multiline': {
                'max': 1,
            },
        }],
    },
}
