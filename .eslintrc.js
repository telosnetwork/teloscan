module.exports = {
  extends: [
    // add more generic rulesets here, such as:
    'eslint:recommended',
    'plugin:vue/recommended' // Use this if you are using Vue.js 2.x.
  ],
  rules: {
    // override/add rules settings here, such as:
    // 'vue/no-unused-vars': 'error'

    // add
    //  comma dangle
    //  4 space indent 



  },
  "env": {
      "browser": true,
      "amd": true,
      "node": true
  },
}
