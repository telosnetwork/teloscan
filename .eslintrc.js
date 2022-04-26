module.exports = {
  // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
  // This option interrupts the configuration hierarchy at this file
  // Remove this if you have an higher level ESLint config file (it usually happens into a monorepos)
  root: true,

  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module' // Allows for the use of imports
  },

  env: {
    browser: true
  },

  // Rules order is important, please avoid shuffling them
  extends: [
    'airbnb-base',
    'plugin:vue/recommended'
  ],

  plugins: [
    // https://eslint.vuejs.org/user-guide/#why-doesn-t-it-work-on-vue-file
    // required to lint *.vue files
    'vue',
  ],

  globals: {
    ga: true, // Google Analytics
    cordova: true,
    __statics: true,
    process: true,
    Capacitor: true,
    chrome: true
  },

  // add your custom rules here
  rules: {
    indent: ['error', 4],
    // allow debugger during development only
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    // Max length of 100 characters in source code
    'max-len': ['error', { code: 100, ignoreUrls: true }],
    // allow wearn ande rror consoles
    'no-console': ['error', { allow: ['warn', 'error'] }],
    // Allow dangling underscores
    'no-underscore-dangle': ['off'],
    // Allow ++ and --
    'no-plusplus': 'off',
    // Put operators atrm  the end of the line (?, :, &&, ||)
    'operator-linebreak': ['error', 'after'],
    // Don't enforce promises being rejected with Error objects
    'prefer-promise-reject-errors': 'off',

    // Use 4 space indents in templates
    'vue/html-indent': ['error', 4],
    // Allow max 2 attributes on a single line element, but once the
    // element is spread across multiple, require one attribute per line
    'vue/max-attributes-per-line': ['error', {
        singleline: 3,
        multiline: {
            max: 1,
            allowFirstLine: false,
        },
    }],
  }
}
