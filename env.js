/*
The environment variables ares set based on the single variable `MAINNET=true`
(or absence thereof) in the root `.env` file. The following env vars are then assigned in
`quasar.config.js`.
*/

const sharedEnv = {
    NETWORK_PROTOCOL: 'https',
    NETWORK_PORT: 443,
    NETWORK_EVM_CONTRACT: 'eosio.evm',
    PROJECT_ID: '14ec76c44bae7d461fa0f5fd5f8a9da1',
};

const TESTNET = {
    ...sharedEnv,
    APP_NAME: 'Teloscan (testnet)',
    NETWORK_HOST: 'testnet.telos.net',
    NETWORK_CHAIN_ID:
      '1eaa0824707c8c16bd25145493bf062aecddfeb56c736f6ba6397f3195f33c9f',
    NETWORK_EVM_RPC: 'https://testnet.telos.net/evm',
    NETWORK_EVM_ENDPOINT: 'https://testnet.telos.net',
    NETWORK_EVM_CHAIN_ID: 41,
    NETWORK_EVM_DISPLAY: 'Telos Testnet',
    NETWORK_EVM_NAME: 'telos-evm-testnet',
    HYPERION_ENDPOINT: 'https://testnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer-test.telos.net',
    TELOS_API_ENDPOINT: 'https://api-dev.telos.net/v1', //'http://localhost:9999/v1', //for local instance of api
    INDEXER_API_ENDPOINT: 'https://api.testnet.teloscan.io/v1',
    EXPORT_API_ENDPOINT: 'https://api.testnet.teloscan.io',
    VERIFIED_CONTRACTS_BUCKET: 'verified-evm-contracts-testnet',
    STAKED_TLOS_CONTRACT_ADDRESS: '0xa9991E4daA44922D00a78B6D986cDf628d46C4DD',
    TELOS_ESCROW_CONTRACT_ADDRESS: '0x7E9cF9fBc881652B05BB8F26298fFAB538163b6f',
    MULTICALL_CONTRACT_ADDRESS: '0x39b0CF441E616e4e21a5f7b37c9CE0Ca750bd05B',
    OREID_APP_ID: 't_1e0417d2456e401893ec106e5e4c6314',
    OREID_APP_ID_NATIVE: 't_a61e9926d5204387a9ac113dfce7cbc5',
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
    NETWORK_EVM_DISPLAY: 'Telos',
    NETWORK_EVM_NAME: 'telos-evm',
    HYPERION_ENDPOINT: 'https://mainnet.telos.net',
    NETWORK_EXPLORER: 'https://explorer.telos.net',
    TELOS_API_ENDPOINT: 'https://api.teloscan.io/v1',  //'http://localhost:9999/v1', //for local instance of api
    INDEXER_API_ENDPOINT: 'https://api.teloscan.io/v1',
    EXPORT_API_ENDPOINT: 'https://api.teloscan.io',
    VERIFIED_CONTRACTS_BUCKET: 'verified-evm-contracts',
    STAKED_TLOS_CONTRACT_ADDRESS: '0xB4B01216a5Bc8F1C8A33CD990A1239030E60C905',
    TELOS_ESCROW_CONTRACT_ADDRESS: '0x95F5713A1422Aa3FBD3DCB8D553945C128ee3855',
    MULTICALL_CONTRACT_ADDRESS: '0xdDCbf776dF3dE60163066A5ddDF2277cB445E0F3',
    OREID_APP_ID: 'p_b5cfbadeb17a44bdaf01e73b3120d202',
    OREID_APP_ID_NATIVE: 'p_751f87258d5b40998b55c626d612fd4e',
};

const env = process.env.NETWORK === 'mainnet' ? MAINNET : TESTNET;

module.exports = env;
