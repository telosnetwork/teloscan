module.exports = {
    // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
    // This option interrupts the configuration hierarchy at this file
    // Remove this if you have an higher level ESLint config file (it usually happens into a monorepos)
    root: true,

    // https://eslint.vuejs.org/user-guide/#how-to-use-a-custom-parser
    // Must use parserOptions instead of "parser" to allow vue-eslint-parser to keep working
    // `parser: 'vue-eslint-parser'` is already included with any 'plugin:vue/**' config and should be omitted
    parserOptions: {
        parser: require.resolve('@typescript-eslint/parser'),
        extraFileExtensions: [ '.vue' ]
    },

    env: {
        browser: true,
        es2021: true,
        node: true,
        'vue/setup-compiler-macros': true,
        jest: true,
    },

    // Rules order is important, please avoid shuffling them
    extends: [
        // Base ESLint recommended rules
        // 'eslint:recommended',

        // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#usage
        // ESLint typescript rules
        'plugin:@typescript-eslint/recommended',

        // Uncomment any of the lines below to choose desired strictness,
        // but leave only one uncommented!
        // See https://eslint.vuejs.org/rules/#available-rules
        'plugin:vue/vue3-essential', // Priority A: Essential (Error Prevention)
        // 'plugin:vue/vue3-strongly-recommended', // Priority B: Strongly Recommended (Improving Readability)
        // 'plugin:vue/vue3-recommended', // Priority C: Recommended (Minimizing Arbitrary Choices and Cognitive Overhead)

        'airbnb-base'

    ],

    plugins: [
        // required to apply rules which need type information
        '@typescript-eslint',

        // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-files
        // required to lint *.vue files
        'vue'

    ],

    globals: {
        ga: 'readonly', // Google Analytics
        cordova: 'readonly',
        __statics: 'readonly',
        __QUASAR_SSR__: 'readonly',
        __QUASAR_SSR_SERVER__: 'readonly',
        __QUASAR_SSR_CLIENT__: 'readonly',
        __QUASAR_SSR_PWA__: 'readonly',
        process: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly'
    },

    // add your custom rules here
    rules: {

        'no-param-reassign': 'off',
        'no-void': 'off',
        'no-nested-ternary': 'off',
        'max-classes-per-file': 'off',

        'no-shadow': 'off',
        '@typescript-eslint/no-shadow': 'error',

        'import/first': 'off',
        'import/named': 'error',
        'import/namespace': 'error',
        'import/default': 'error',
        'import/export': 'error',
        'import/extensions': 'off',
        'import/no-unresolved': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/prefer-default-export': 'off',

        'prefer-promise-reject-errors': 'off',

        quotes: ['warn', 'single', { avoidEscape: true }],

        // this rule, if on, would require explicit return type on the `render` function
        '@typescript-eslint/explicit-function-return-type': 'off',

        // in plain CommonJS modules, you can't use `import foo = require('foo')` to pass this rule, so it has to be disabled
        '@typescript-eslint/no-var-requires': 'off',

        // The core 'no-unused-vars' rules (in the eslint:recommended ruleset)
        // does not work with type definitions
        'no-unused-vars': 'off',

        // allow debugger during development only
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

        'no-plusplus': 'off',
        'max-len': 'off',
        'no-console': [2, { 'allow': ['warn', 'error', 'info', 'debug', 'assert'] }],
        'indent': ['error', 4],
        'no-underscore-dangle': 'off',
        'camelcase': 'off',
        'no-use-before-define': 'off',
        'func-names': 'off',
        'no-alert': 'off',
        'class-methods-use-this': 'off',
        'no-continue': 'off',
        'no-await-in-loop': 'off',
        'no-restricted-syntax': 'off',
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
    }
}
