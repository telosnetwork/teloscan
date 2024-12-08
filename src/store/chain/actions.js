import { BigNumber } from 'ethers';

let rpcId = 0;

export async function doRPC(_, { method, params }) {
    const rpcPayload = {
        jsonrpc: '2.0',
        id: ++rpcId,
        method,
        params,
    };
    const result = await this.$evmEndpoint.post('/evm', rpcPayload);

    return result.data;
}

export const fetchTlosPrice = async function({ commit }) {
    try {
        const response = await this.$indexerApi.get('/tokens/marketdata?tokens=TLOS&vs=usd');
        const tlosPrice = parseFloat(response.data?.results[0].price).toFixed(4);
        commit('setTlosPrice', tlosPrice);
    } catch (error) {
        console.error('fetchTlosPrice: ', error.message);
        commit('general/setErrorMsg', error.message || error, { root: true });
    }
};

export const fetchGasPrice = async function({ dispatch, commit }) {
    try {
        const gasPriceResponse = await dispatch('doRPC', {
            method: 'eth_gasPrice',
            params: [],
        });
        commit('setGasPrice', BigNumber.from(gasPriceResponse.result));
    } catch (error) {
        console.error('fetchGasPrice');
        commit('general/setErrorMsg', error.message || error, { root: true });
    }
};

export const fetchLatestBlock = async function({ dispatch, commit }) {
    try {
        const getBlockResponse = await dispatch('doRPC', {
            method: 'eth_blockNumber',
            params: [],
        });
        commit('setLatestBlock', BigNumber.from(getBlockResponse.result));
    } catch (error) {
        console.error('fetchLatestBlock');
        commit('general/setErrorMsg', error.message || error, { root: true });
    }
};
