import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserEthereumSupport({ commit }) {
    const provider = await detectEthereumProvider();

    commit('setBrowserSupportsEthereum', !!provider);
}
