/*
The environment variables ares set based on the single variable `MAINNET=true`
(or absence thereof) in the root `.env` file. The following env vars are then assigned in
`quasar.config.js`.

Cross chain support: most of the variables that were here have been moved to `src/antelope/chains/evm`

*/
const sharedEnv = {
    PROJECT_ID: '14ec76c44bae7d461fa0f5fd5f8a9da1',
};

const TESTNET = {
    ...sharedEnv,
    APP_NAME: 'Teloscan (testnet)',
    NETWORK_EVM_NAME: 'telos-evm-testnet',
};

const MAINNET = {
    ...sharedEnv,
    APP_NAME: 'Teloscan',
    NETWORK_EVM_NAME: 'telos-evm',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
