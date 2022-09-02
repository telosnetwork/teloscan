/*
The environment variables ares set based on the single variable `MAINNET=true`
(or absence thereof) in the root `.env` file. The following env vars are then assigned in
`quasar.config.js`.
*/

const sharedEnv = {
    NETWORK_PROTOCOL: 'https',
    NETWORK_PORT: 443,
    NETWORK_EVM_CONTRACT: 'eosio.evm',
};

const TESTNET = {
    ...sharedEnv,
    APP_NAME: 'Teloscan (test net)',
    NETWORK_HOST: 'testnet.telos.net',
    NETWORK_CHAIN_ID:
      '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
    NETWORK_EVM_RPC: 'https://testnet.telos.net/evm',
    NETWORK_EVM_ENDPOINT: 'https://testnet.telos.caleos.io',
    NETWORK_EVM_CHAIN_ID: 41,
    HYPERION_ENDPOINT: 'https://testnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer-test.telos.net',
    TELOS_API_ENDPOINT: 'https://api-dev.telos.net/v1', // http://localhost:9999/v1 //for local instance of api
    VERIFIED_CONTRACTS_BUCKET: 'verified-evm-contracts-testnet',
    STLOS_CONTRACT_ADDRESS: '0x5a9b40a59109a848b82a0ff153910bb595082e09',
    STLOS_ESCROW_CONTRACT_ADDRESS: '0xB679ab23726d7EaF1b3b807b018A27362E7B85F8',
};

const MAINNET = {
    ...sharedEnv,
    APP_NAME: 'Teloscan',
    NETWORK_HOST: 'mainnet.telos.net',
    NETWORK_CHAIN_ID:
      '4667b205c6838ef70ff7988f6e8257e8be0e1284a2f59699054a018f743b1d11',
    NETWORK_EVM_RPC: 'https://mainnet.telos.net/evm',
    NETWORK_EVM_ENDPOINT: 'https://mainnet.telos.net',
    NETWORK_EVM_CHAIN_ID: 40,
    HYPERION_ENDPOINT: 'https://mainnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer.telos.net',
    TELOS_API_ENDPOINT: 'https://api.telos.net/v1',
    VERIFIED_CONTRACTS_BUCKET: 'verified-evm-contracts',
    STLOS_CONTRACT_ADDRESS: '',
    STLOS_ESCROW_CONTRACT_ADDRESS: '',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
