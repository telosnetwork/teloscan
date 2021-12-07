<template>
  <q-layout view="lhh Lpr lFf">
    <q-header class="transparent">
      <q-toolbar class="text-white toolbar transparent">
        <div class="q-py-sm">
          <router-link to="/" class="row items-center q-gutter-x-xs">
            <img alt="Telos EVM logo" src="~assets/evm_logo.png" width="45" />
            <div class="text-h5 text-white">Teloscan</div>
          </router-link>
        </div>
        <q-space/>
        <!-- <q-btn stretch flat class="desktop-only" label="Blocks" /> -->

        <!-- <q-separator dark vertical class="desktop-only" />

        <q-btn stretch flat class="desktop-only" label="Transactions" to="/transactions" /> -->

        <!-- <q-separator dark vertical class="desktop-only" /> -->

        <search class="taskbarSearch desktop-only text-center "></search>

        <q-btn
          flat
          dark
          standout
          class="q-px-md"
          @click="toggleDarkMode()"
          :icon="$q.dark.isActive ? 'fas fa-sun' : 'fas fa-moon'"
        >
        </q-btn>

        <q-btn-dropdown flat>
          <template v-slot:label>
            {{ mainnet ? "Mainnet" : "Testnet" }}
          </template>

          <q-list style="width : 200px">
            <q-item-label header>Network</q-item-label>

            <q-item
              v-if="!mainnet"
              clickable
              v-close-popup
              to="https://www.teloscan.io/"
            >
              <q-item-section>
                <q-item-label> Mainnet </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              v-if="mainnet"
              clickable
              v-close-popup
              to="https://testnet.teloscan.io/"
            >
              <q-item-section>
                <q-item-label>Testnet</q-item-label>
              </q-item-section>
            </q-item>

            <!-- <q-separator inset spaced />
            <q-item-label header>Blockchain</q-item-label>

            <q-item clickable v-close-popup to="/">
              <q-item-section>
                <q-item-label>Blocks</q-item-label>
              </q-item-section>
            </q-item>

            <q-item clickable v-close-popup to="/transactions">
              <q-item-section>
                <q-item-label>Transactions</q-item-label>
              </q-item-section>
            </q-item> -->
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>

    <div class="banner"></div>

    <div class="row justify-center items-center pageContainer">
      <q-page-container class="pageContainer ">
        <router-view />
      </q-page-container>
    </div>
  </q-layout>
</template>

<script>
import Search from "src/components/SearchToolbar.vue";
export default {
  name: "MainLayout",
  components: { Search },
  data() {
    return {
      mainnet:
        process.env.NETWORK_EVM_ENDPOINT == "https://mainnet.telos.net"
          ? true
          : false
    };
  },
  methods: {
    toggleDarkMode() {
      this.$q.dark.toggle();
      localStorage.setItem("darkModeEnabled", this.$q.dark.isActive);
    }
  }
};
</script>

<style lang="scss" scoped>
.pageContainer {
  flex: 0 1 1200px;
}
.banner {
  z-index: 0;
  height: 400px;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background: linear-gradient(#252a5e 27.19%, #2d4684 65.83%);
}
</style>
