import Vue from 'vue';
import Vuex from 'vuex';

import login from './login';
import general from './general';
import evm from './evm';
import staking from './staking-store';

Vue.use(Vuex);

export default function() {
    return new Vuex.Store({
        modules: {
            general,
            login,
            evm,
            staking,
        },

        strict: process.env.DEV,
    });
}
