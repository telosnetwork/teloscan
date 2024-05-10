// Actions:
export const toggleDisplayDecimals = async function({ commit }) {
    const displayDecimals = this.getters['general/displayDecimals'] === 'fixed' ? 'dynamic' : 'fixed';
    commit('setDisplayDecimals', displayDecimals);
};

export const setHighlightAddress = async function({ commit }, address) {
    commit('setHighlightAddress', address);
};

export const setHighlightMethod = async function({ commit }, method) {
    commit('setHighlightMethod', method);
};

export const setHighlightTx = async function({ commit }, tx) {
    commit('setHighlightTx', tx);
};
