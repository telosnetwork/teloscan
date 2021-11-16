export const setLoadingWallet = (state, wallet) => {
  state.loading = wallet;
};

export const setAccountName = (state, accountName) => {
  state.accountName = accountName;
};

export const setAutoLogin = (state, status) => {
  state.autoLogin = status;
};

export const setProfile = (state, profile = undefined) => {
  if (!profile) {
    return;
  }
  state.profiles[profile.account_name] = profile;
};
