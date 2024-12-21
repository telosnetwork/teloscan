/*
The environment variables ares set based on the single variable `MAINNET=true`
(or absence thereof) in the root `.env` file. The following env vars are then assigned in
`quasar.config.js`.

Cross chain support: most of the variables that were here have been moved to `src/config/chains`

*/
const sharedEnv = {
    PROJECT_ID: '14ec76c44bae7d461fa0f5fd5f8a9da1',
};

const chains = {
    testnet: {
        ...sharedEnv,
        APP_NAME: 'Teloscan (testnet)',
        NETWORK_EVM_NAME: 'telos-evm-testnet',
    },
    mainnet: {
        ...sharedEnv,
        APP_NAME: 'Teloscan',
        NETWORK_EVM_NAME: 'telos-evm',
    },
    zkevm_testnet: {
        ...sharedEnv,
        APP_NAME: 'Teloscan zkEVM (testnet)',
        NETWORK_EVM_NAME: 'telos-zkevm-testnet',
    },
};

const env = chains[process.env.NETWORK?.toLowerCase()] || chains.testnet;

module.exports = env;
