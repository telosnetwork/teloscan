import Vue from "vue";
import Vuex from "vuex";

import account from "./account";
import general from "./general";

Vue.use(Vuex);

export default function() {
  const Store = new Vuex.Store({
    modules: {
      general,
      account
    },

    strict: process.env.DEV
  });

  return Store;
}
