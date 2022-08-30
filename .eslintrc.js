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
        'vue/setup-compiler-macros': true // new!
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/recommended',
    ],
    plugins: [
        'vue',
    ],
    globals: {
        ga: true, // Google Analytics
        __statics: true,
        process: true,
    },
    rules: {
        // allow debugger during development only
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

        'comma-dangle': ['error', 'always-multiline'],
        'indent': ['error', 4],
        'vue/html-indent': ['warn', 4, { 'baseIndent': 0, }], // eztodo switch to error (after pug removal?)
        'quotes': ['error', 'single'],
    },
}
