import state from 'src/store/contract/state';
import * as getters from 'src/store/contract/getters';
import * as mutations from 'src/store/contract/mutations';
import * as actions from 'src/store/contract/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
