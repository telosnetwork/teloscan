export const setLogin = (state, {address, nativeAccount, provider}) => {
  state.address = address;
  state.provider = Object.freeze(provider);
  state.isLoggedIn = !!address;
  if (nativeAccount) {
    state.isNative = true;
    state.nativeAccount = nativeAccount;
  }
};
