const { ethers } = require("ethers");
const providersError = "More than one provider is active, disable additional providers.";
const unsupportedError ="current ethereum provider is not supported.";

const switchEthereumChain = async () => {
    const provider = getProvider();

    if (provider){
        const chainId = parseInt(process.env.NETWORK_EVM_CHAIN_ID, 10);
        const chainIdParam = `0x${chainId.toString(16)}`
        const mainnet = chainId === 40;
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainIdParam }],
            });
            return true;
        } catch (e) {
            if (e.code === 4902) {  // "Chain <hex chain id> hasn't been added"
                try {
                    await provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: chainIdParam,
                            chainName: `Telos EVM ${mainnet ? 'Mainnet' : 'Testnet'}`,
                            nativeCurrency: {
                                name: `Telos`,
                                symbol: `TLOS`,
                                decimals: 18,
                            },
                            rpcUrls: [`https://${mainnet ? 'mainnet' : 'testnet'}.telos.net/evm`],
                            blockExplorerUrls: [`https://${mainnet ? '' : 'testnet'}.teloscan.io`]
                        }],
                    });
                    return true;
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }else{
        return false;
    }
};

const getProvider = () => {
    const provider = window.ethereum.isMetaMask || window.ethereum.isCoinbaseWallet ?
        window.ethereum : 
        null
    if (!provider){
        console.error(providersError, 'or', unsupportedError)
    }
    return provider;
}

const addNetwork = async () => {
    const provider = getProvider();
    if (provider) {
        const chainId = parseInt(process.env.NETWORK_EVM_CHAIN_ID, 10);
        const chainIdParam = `0x${chainId.toString(16)}`
        const mainnet = chainId === 40;
        try {
            await provider.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: chainIdParam,
                    chainName: `Telos EVM ${mainnet ? 'Mainnet' : 'Testnet'}`,
                    nativeCurrency: {
                        name: `Telos`,
                        symbol: `TLOS`,
                        decimals: 18,
                    },
                    rpcUrls: [`https://${mainnet ? 'mainnet' : 'testnet'}.telos.net/evm`],
                    blockExplorerUrls: [`https://${mainnet ? '' : 'testnet'}.teloscan.io`],
                }]
            });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    } else {
        return false;
    }
}

const isConnected = async () => {
    debugger;
    const provider = getProvider();
    debugger;
    const checkProvider = new ethers.providers.Web3Provider(provider);
    const accounts = await checkProvider.listAccounts();
    if (accounts.length > 0){
        const { chainId } = await checkProvider.getNetwork();
        if (chainId != process.env.NETWORK_EVM_CHAIN_ID){
            await switchEthereumChain();
        }
        return accounts[0];
    }
    return false;
}

const requestAccounts = async () => {
    const provider = getProvider();
    const accessGranted =  await provider.request({ method: 'eth_requestAccounts' })
    return accessGranted > 0 ? accessGranted[0] : false;
}

module.exports = { 
    switchEthereumChain, 
    addNetwork, 
    getProvider, 
    isConnected, 
    requestAccounts,
    providersError,
    unsupportedError
}