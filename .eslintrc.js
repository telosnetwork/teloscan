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
    overrides:[
        {
            'files': ['**/*.ts', '**/*.tsx'],
            'env': { 'browser': true, 'es6': true, 'node': true },
            'extends': [
                'eslint:recommended',
                'plugin:@typescript-eslint/eslint-recommended',
                'plugin:@typescript-eslint/recommended',
            ],
            'parser': '@typescript-eslint/parser',
            'parserOptions': {
                'ecmaFeatures': { 'jsx': true },
                'ecmaVersion': 2018,
                'sourceType': 'module',
                'project': './tsconfig.json',
            },
            'plugins': ['vue', '@typescript-eslint'],
            'rules': {
                'indent': ['error', 2, { 'SwitchCase': 1 }],
                'linebreak-style': ['error', 'unix'],
                'quotes': ['error', 'single'],
                'comma-dangle': ['error', 'always-multiline'],
                '@typescript-eslint/no-explicit-any': 0,
            },
        },
    ],
}
