export const TELOSCAN_MAINNET_URL = 'https://teloscan.io';
export const TELOSCAN_TESTNET_URL = 'https://testnet.teloscan.io';
export const BETA_TELOSCAN_MAINNET_URL = 'https://beta.teloscan.io';
export const BETA_TELOSCAN_TESTNET_URL = 'https://beta.testnet.teloscan.io';

export const TELOS_MAINNET_CHAIN_ID = 40;
export const TELOS_TESTNET_CHAIN_ID = 41;

const currentChainId = Number(process.env.NETWORK_EVM_CHAIN_ID);
export const IS_MAINNET = currentChainId === TELOS_MAINNET_CHAIN_ID;
export const IS_TESTNET = currentChainId === TELOS_TESTNET_CHAIN_ID;
