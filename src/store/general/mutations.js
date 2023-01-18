export const setErrorMsg = (state, errorMsg) => {
    state.errorMsg = errorMsg;
};

export const setSuccessMsg = (state, successMsg) => {
    state.successMsg = successMsg;
};

export const setIsLoading = (state, isLoading) => {
    state.isLoading = isLoading;
};

export const setBrowserSupportsMetaMask = (state, browserSupportsMetaMask) => {
    state.browserSupportsMetaMask = browserSupportsMetaMask;
};

export const setBraveBrowser = (state, isBraveBrowser) => {
    state.isBraveBrowser = isBraveBrowser;
}
