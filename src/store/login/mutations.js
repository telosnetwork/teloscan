export const setLogin = (state, { address, nativeAccount }) => {
    state.address = address;
    state.isLoggedIn = !!address;
    if (nativeAccount) {
        state.isNative = true;
        state.nativeAccount = nativeAccount;
    } else {
        state.isNative = false;
        state.nativeAccount = null;
    }
};
