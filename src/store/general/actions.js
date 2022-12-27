import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserMetaMaskSupport({ commit }) {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });
    debugger;


    commit('setBrowserSupportsMetaMask', !!provider);
}
