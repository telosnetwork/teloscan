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
    APP_NAME: 'Teloscan (testnet)',
    NETWORK_HOST: 'testnet.telos.net',
    NETWORK_CHAIN_ID:
      '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
    NETWORK_EVM_RPC: 'https://testnet.telos.net/evm',
    NETWORK_EVM_ENDPOINT: 'https://testnet.telos.caleos.io',
    NETWORK_EVM_CHAIN_ID: 41,
    HYPERION_ENDPOINT: 'https://testnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer-test.telos.net',
    TELOS_API_ENDPOINT: 'https://api-dev.telos.net/v1', //'http://localhost:9999/v1', //for local instance of api
    VERIFIED_CONTRACTS_BUCKET: 'verified-evm-contracts-testnet',
    STAKED_TLOS_CONTRACT_ADDRESS: '0xa9991E4daA44922D00a78B6D986cDf628d46C4DD',
    TELOS_ESCROW_CONTRACT_ADDRESS: '0x7E9cF9fBc881652B05BB8F26298fFAB538163b6f',
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
    TELOS_API_ENDPOINT: 'https://api.telos.net/v1', //'http://localhost:9999/v1', //for local instance of api
    VERIFIED_CONTRACTS_BUCKET: 'verified-evm-contracts',
    STAKED_TLOS_CONTRACT_ADDRESS: '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
    TELOS_ESCROW_CONTRACT_ADDRESS: '0x95F5713A1422Aa3FBD3DCB8D553945C128ee3855',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
