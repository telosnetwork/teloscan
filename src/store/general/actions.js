import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserMetaMaskSupport({ commit }) {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });
    // eslint-disable-next-line
    debugger;


    commit('setBrowserSupportsMetaMask', !!provider);
}
