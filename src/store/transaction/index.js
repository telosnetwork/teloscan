import state from 'src/store/transaction/state';
import * as getters from 'src/store/transaction/getters';
import * as mutations from 'src/store/transaction/mutations';
import * as actions from 'src/store/transaction/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
