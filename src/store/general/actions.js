// import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserMetaMaskSupport({ commit }) {
    // const provider = await detectEthereumProvider({ mustBeMetaMask: true });

    commit('setBrowserSupportsMetaMask', false);
}
