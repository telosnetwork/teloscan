module.exports = {
    root: true,
    parser: 'vue-eslint-parser',
    parserOptions: {
        extraFileExtensions: ['.vue'],
        parser: '@typescript-eslint/parser',
        sourceType: 'module',
    },
    env: {
        'browser': true,
        'es2021': true,
        'amd': true,
        'node': true,
        'vue/setup-compiler-macros': true,
        'jest/globals': true,
    },
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:vue/vue3-essential',
        'eslint:recommended',
    ],
    plugins: [
        '@typescript-eslint',
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
        'eol-last': ['error', 'always'],
        'object-curly-spacing': ['error', 'always'],
        'array-bracket-spacing': ['error', 'never'],
        'space-in-parens': ['error', 'never'],
        'computed-property-spacing': ['error', 'never'],
        'comma-spacing': ['error', { 'before': false, 'after': true }],
        'no-trailing-spaces': 'error',
        'eqeqeq': 'error',
        'semi': ['error', 'always'],
        'arrow-parens': [2, 'as-needed', { 'requireForBlockBody': true }],
        'arrow-body-style': ['error', 'as-needed'],
        'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],
        'curly': 'error',
        'brace-style': ['error', '1tbs', { 'allowSingleLine': false }],
        'no-restricted-imports': ['error', {
            'patterns': ['.*'], // disallow relative imports
        }],
        'no-return-assign': ['error', 'always'],
        'no-param-reassign': 'error',


        'vue/html-indent': ['warn', 4, { 'baseIndent': 0 }],
        'vue/max-attributes-per-line': ['warn', {
            'singleline': {
                'max': 3,
            },
            'multiline': {
                'max': 1,
            },
        }],
        'vue/first-attribute-linebreak': ['error', {
            'singleline': 'ignore',
            'multiline': 'below',
        }],
        'vue/component-tags-order': ['error', {
            'order': ['script', 'template', 'style'],
        }],
        'vue/html-self-closing': ['error', {
            'html': {
                'void': 'never',
                'normal': 'never',
                'component': 'always',
            },
            'svg': 'always',
        }],
        'vue/multi-word-component-names': 'error',
        'vue/no-static-inline-styles': ['error', {
            'allowBinding': false,
        }],
        'vue/attributes-order': ['error', {
            'order': [
                'DEFINITION',
                'LIST_RENDERING',
                'CONDITIONALS',
                'RENDER_MODIFIERS',
                'GLOBAL',
                ['UNIQUE', 'SLOT'],
                'TWO_WAY_BINDING',
                'OTHER_DIRECTIVES',
                'OTHER_ATTR',
                'EVENTS',
                'CONTENT',
            ],
            'alphabetical': false,
        }],
        'vue/html-closing-bracket-newline': ['error', {
            'singleline': 'never',
            'multiline': 'always',
        }],
        'vue/component-options-name-casing': ['error', 'PascalCase'],
        'vue/component-definition-name-casing': ['error', 'PascalCase'],
        'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    },
};
