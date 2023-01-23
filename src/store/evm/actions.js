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

// TODO: make sure we're not using this and remove...
//  should be using the $contractManager that's on prototype (this.$contractManager)
export async function getContract(_, { address }) {
    return await this.$contractManager.getContract(address);
}

export const fetchTlosPrice = async function({ commit }) {
    try {
        const response = await this.$api.getTableRows({
            code: 'delphioracle',
            limit: '1000',
            scope: 'tlosusd',
            table: 'datapoints',
        });

        const tlosPrice = response.rows[0].median / 10000;
        commit('setTlosPrice', tlosPrice);
    } catch (error) {
        console.error('fetchTlosPrice');
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
