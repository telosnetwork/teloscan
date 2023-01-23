import state from 'src/store/login/state';
import * as getters from 'src/store/login/getters';
import * as mutations from 'src/store/login/mutations';
import * as actions from 'src/store/login/actions';

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
