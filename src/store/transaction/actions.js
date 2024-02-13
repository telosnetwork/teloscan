
export async function doAPI({ method, params }) {
    return { method, params };
}

export async function fetchTransferTransactions({ commit }) {
    try {
        let transactions = [];
        commit('setTransactions', transactions);
    } catch (error) {
        console.error('fetchTransactions');
        commit('general/setErrorMsg', error.message || error, { root: true });
    }

}

export async function fetchTransactions({ commit }) {
    try {
        let transactions = [];
        commit('setTransactions', transactions);
    } catch (error) {
        console.error('fetchTransactions');
        commit('general/setErrorMsg', error.message || error, { root: true });
    }
}
