
module.exports = {
    presets: [
        '@quasar/babel-preset-app',
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
    ],
};
