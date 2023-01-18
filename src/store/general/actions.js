import detectEthereumProvider from '@metamask/detect-provider';

export async function fetchBrowserMetaMaskSupport({ commit }) {
    debugger;
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });
    debugger;
    // required because brave wallet integration deceptively has provider.isMetaMask === true
    // const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;
    const isBraveBrowser = navigator.brave && await navigator.brave.isBrave()
    // const isMobile = mobileRegex.test(navigator.userAgent);
    const isMetaMask = provider?.isMetaMask;
    commit('setBrowserSupportsMetaMask', isMetaMask);
    commit ('setBraveBrowser', isBraveBrowser);
}
