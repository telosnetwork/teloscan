import Vue from "vue";
import Vuex from "vuex";

import login from "./login";
import general from "./general";
import evm from "./evm";

Vue.use(Vuex);

export default function() {
    const Store = new Vuex.Store({
        modules: {
            general,
            login,
            evm,
        },

        strict: process.env.DEV
    });

    return Store;
}
