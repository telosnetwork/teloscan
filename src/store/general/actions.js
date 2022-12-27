import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserMetaMaskSupport({ commit }) {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });
    const isBraveBrowserMobile = (navigator.brave && await navigator.brave.isBrave() || false) &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent);
    const isMetaMask = (provider?.isMetaMask && !isBraveBrowserMobile) ?? false

    commit('setBrowserSupportsMetaMask', isMetaMask);
}
