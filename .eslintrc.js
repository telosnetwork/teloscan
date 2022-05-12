module.exports = {
    extends: [
    // add more generic rulesets here, such as:
        'eslint:recommended',
        'plugin:vue/recommended', // Use this if you are using Vue.js 2.x.
    ],
    rules: {
        'comma-dangle': ['error', 'always-multiline'],
        'indent': ['error', 4],
        'quotes': ['error', 'single'],
    },
    env: {
        'browser': true,
        'amd': true,
        'node': true,
    },
}
