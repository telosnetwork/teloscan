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
                } catch (e) {
                    console.error(e);
                }
            }
        }
    }
};

const getProvider = () => {
    const provider = window.ethereum.providers ? 
        window.ethereum.providers.find((provider) => provider.isMetaMask) :
        window.ethereum; 
    return provider;
}

const addNetwork = async () => {
    const provider = getProvider();
    debugger;
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
        console.error(
            "Can't setup the network on metamask because window.ethereum is undefined"
        );
        return false;
    }
}
 

module.exports = { switchEthereumChain, addNetwork, getProvider }