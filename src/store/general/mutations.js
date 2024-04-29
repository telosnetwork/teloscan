export const setErrorMsg = (state, errorMsg) => {
    state.errorMsg = errorMsg;
};

export const setSuccessMsg = (state, successMsg) => {
    state.successMsg = successMsg;
};

export const setIsLoading = (state, isLoading) => {
    state.isLoading = isLoading;
};

export const setHighlightAddress = (state, highlightAddress) => {
    state.highlightAddress = highlightAddress;
};

export const setHighlightMethod = (state, highlightMethod) => {
    state.highlightMethod = highlightMethod;
};

export const setDisplayDecimals = (state, displayDecimals) => {
    state.displayDecimals = displayDecimals;
};
