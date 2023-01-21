import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserMetaMaskSupport({ commit }) {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });

    // required because brave wallet integration deceptively has provider.isMetaMask === true
    // eslint-disable-next-line max-len
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;
    const isBraveBrowserMobile = (navigator.brave && await navigator.brave.isBrave() || false) &&
        mobileRegex.test(navigator.userAgent);
    const isMetaMask = provider?.isMetaMask && !isBraveBrowserMobile;

    commit('setBrowserSupportsMetaMask', isMetaMask);
}
