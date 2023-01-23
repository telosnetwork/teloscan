export const login = async function(
    { commit, dispatch },
    { idx, account },
) {
    const authenticator = this.$ual.authenticators[idx];
    try {
        commit('setLoadingWallet', authenticator.getStyle().text);
        await authenticator.init();
        if (!account) {
            const requestAccount = await authenticator.shouldRequestAccountName();
            if (requestAccount) {
                await dispatch('fetchAvailableAccounts', idx);
                commit('setRequestAccount', true);
                return;
            }
        }
        const users = await authenticator.login(account);
        if (users.length) {
            const account = users[0];
            const accountName = await account.getAccountName();
            this.$ualUser = account;
            this.$type = 'ual';
            commit('setAccountName', accountName);
            localStorage.setItem('autoLogin', authenticator.constructor.name);
            localStorage.setItem('account', accountName);
            localStorage.setItem('returning', true);
            dispatch('getAccountProfile');
        }
    } catch (e) {
        const error =
      (authenticator.getError() && authenticator.getError().message) ||
      e.message ||
      e.reason;
        commit('general/setErrorMsg', error, { root: true });
        console.log('Login error: ', error);
    } finally {
        commit('setLoadingWallet');
    }
};

export const autoLogin = async function({ dispatch, commit }, returnUrl) {
    const { authenticator, idx } = getAuthenticator(this.$ual);
    if (authenticator) {
        commit('setAutoLogin', true);
        await dispatch('login', {
            idx,
            returnUrl,
            account: localStorage.getItem('account'),
        });
        commit('setAutoLogin', false);
    }
};

const getAuthenticator = function(ual, wallet = null) {
    const authWallet = wallet || localStorage.getItem('autoLogin');
    const idx = ual.authenticators.findIndex(
        auth => auth.constructor.name === authWallet,
    );
    return {
        authenticator: ual.authenticators[idx],
        idx,
    };
};

export const logout = async function({ getters }) {
    if (getters.isNative) {
        const { authenticator } = getAuthenticator(this.$ual);
        try {
            authenticator && (await authenticator.logout());
        } catch (error) {
            console.log('Authenticator logout error', error);
        }

        localStorage.removeItem('autoLogin');

        if (this.$router.currentRoute.path !== '/') {
            this.$router.push({ path: '/' });
        }
    }
};
