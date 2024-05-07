// Actions:
export const toggleDisplayDecimals = async function({ commit }) {
    const displayDecimals = this.getters['general/displayDecimals'] === 'fixed' ? 'dynamic' : 'fixed';
    commit('setDisplayDecimals', displayDecimals);
};

