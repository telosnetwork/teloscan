import state from './state'
import * as getters from './getters'
import * as mutations from './mutations'
import * as actions from './actions'

// TODO: maybe this better...
//   preloading the file so we don't have multiple components asking for contract and all triggering the token-list download at once
//actions.getContract({}, {address: '0xdead'});

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
