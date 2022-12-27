import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserMetaMaskSupport({ commit }) {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });
    const isBraveBrowser = (navigator.brave && await navigator.brave.isBrave() || false);
    const isMetaMask = (provider?.isMetaMask && !isBraveBrowser) ?? false

    commit('setBrowserSupportsMetaMask', isMetaMask);
}
