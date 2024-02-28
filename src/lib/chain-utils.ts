export const TELOSCAN_MAINNET_URL = 'https://teloscan.io';
export const TELOSCAN_TESTNET_URL = 'https://testnet.teloscan.io';

export const TELOS_MAINNET_CHAIN_ID = 40;
export const TELOS_TESTNET_CHAIN_ID = 41;

export function isMainnet() {
    return [TELOS_MAINNET_CHAIN_ID].includes(Number(process.env.NETWORK_EVM_CHAIN_ID));
}

export function isTestnet() {
    return [TELOS_TESTNET_CHAIN_ID].includes(Number(process.env.NETWORK_EVM_CHAIN_ID));
}
