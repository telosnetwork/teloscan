import { boot } from 'quasar/wrappers';
import { initAntelope } from 'src/antelope/wallets/init';
import { evmSettings, useChainStore } from 'src/antelope';

export default boot(({ app }) => {
    initAntelope(app);

    const defaultNetwork = Object.keys(evmSettings)[0];
    let network = new URLSearchParams(window.location.search).get('network');
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



