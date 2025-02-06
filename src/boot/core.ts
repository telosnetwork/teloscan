import { boot } from 'quasar/wrappers';
import { initCore } from 'src/core/wallets/init';
import { evmSettings, useChainStore } from 'src/core';

export default boot(({ app }) => {
    initCore(app);

    const defaultNetwork = Object.keys(evmSettings)[0];
    let network = new URLSearchParams(window.location.search).get('network') ?? process.env.NETWORK_EVM_NAME;
    if (network) {
        const exists = Object.keys(evmSettings).some(key => evmSettings[key].getNetwork() === network);
        if (!exists) {
            network = defaultNetwork;
        }
    } else {
        network = defaultNetwork;
    }
    useChainStore().setChain('not-used', network);
});



