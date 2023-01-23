import state from 'src/store/general/state';
import * as getters from 'src/store/general/getters';
import * as mutations from 'src/store/general/mutations';
import * as actions from 'src/store/general/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
