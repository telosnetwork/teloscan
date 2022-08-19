// eztodo switch keys to exported constants

import { BigNumber } from 'ethers';
import { evm } from 'boot/evm';
import { formatBN, WEI_PRECISION } from 'src/lib/utils';

export default {
    namespaced: true,
    state: () => ({
        stlosContractInstance: null,
        escrowContractInstance: null,
        tlosBalance: null,
        stlosBalance: null,
    }),
    getters: {
        tlosBalancePretty({ tlosBalance }) {
            if (tlosBalance === null)
                return null;

            return formatBN(tlosBalance, WEI_PRECISION, 3);
        },
        redeemableStlosBalance() {},
        stlosContractInstance: (state) => state.stlosContractInstance, // eztodo remove and use mapstate in component
        escrowContractInstance() {},
    },
    mutations: {
        setStlosContractInstance(state, instance) {
            state.stlosContractInstance = instance;
        },
        setEscrowContractInstance(state, instance) {
            state.escrowContractInstance = instance;
        },
        setTlosBalance(state, balance) {
            state.tlosBalance = balance;
        },
        setStlosBalance(state, balance) {
            state.stlosBalance = balance;
        },
    },
    actions: {
        fetchAccountTlosBalance({ commit }, address) {
            const handleError = (message) => {
                commit('setTlosBalance', null);
                console.error(`Failed to get user EVM account balance: ${message}`);
            }

            return evm.telos.getEthAccount(address)
                .then(account => {
                    commit('setTlosBalance', account.balance.toString());
                })
                .catch(({ message }) => {
                    handleError(message);
                });
        },
        fetchAccountStlosBalance() {},
        async fetchStlosContract(context, { contractManager, providerManager }) {
            debugger;

            try {
                const contract = await contractManager.getContract(process.env.STLOS_CONTRACT_ADDRESS);
                const signer = providerManager.getEthersProvider().getSigner();
                const contractInstance = contract.getContractInstance(signer, true);

                context.commit('setStlosContractInstance', contractInstance);
            } catch ({ message }) {
                context.commit('setStlosContractInstance', null);
                console.error(`Failed to get sTLOS contract instance: ${message}`);
            }
        },
        fetchEscrowContract() {},
        depositTlos({ dispatch, state }, wei) {
            const value = BigNumber.from(wei);

            // eztodo handle stlosContractInstance === null

            return state.stlosContractInstance['depositTLOS()']({ value })
                .catch(({ message }) => {
                    console.error(`Failed to stake TLOS: ${message}`);
                })
                .finally((txHash = null) => {
                    dispatch('fetchAccountTlosBalance');
                    dispatch('fetchAccountStlosBalance');

                    return txHash;
                });
        },
    },
}
