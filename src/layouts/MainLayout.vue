<template>
  <q-layout view="lHh Lpr lFf">
    
    <q-header class="transparent">
      
      <q-toolbar class="text-white toolbar">

        <q-toolbar-title>
          <q-btn flat stretch to="/">
            <img alt="Telos logo" src="~assets/Teloscan_logo.svg"  />
          </q-btn>
        </q-toolbar-title>

        <!-- <q-btn stretch flat class="desktop-only" label="Blocks" /> -->

        <!-- <q-separator dark vertical class="desktop-only" />

        <q-btn stretch flat class="desktop-only" label="Transactions" to="/transactions" /> -->

        <!-- <q-separator dark vertical class="desktop-only" /> -->

        <search class="taskbarSearch desktop-only"></search>
        <q-space />

        <q-btn
          stretch 
          flat
          @click="toggleDarkMode()"
          :icon="$q.dark.isActive ? 'fas fa-sun' : 'fas fa-moon'">
        </q-btn>

        <q-separator dark vertical class="desktop-only" />

        <q-btn-dropdown stretch flat >
          <template v-slot:label>

          {{mainnet? "Mainnet":"Testnet"}}

        </template>
          
          <q-list style="width : 200px">

            <q-item-label header>Network</q-item-label>

            <q-item v-if="!mainnet"  clickable v-close-popup to="https://www.teloscan.io/">
              <q-item-section>
                <q-item-label> Mainnet </q-item-label>
              </q-item-section>
            </q-item>

            <q-item v-if="mainnet" clickable v-close-popup to="https://testnet.teloscan.io/">
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

    <div class="row justify-center items-center">
      <q-page-container class="pageContainer">
        <router-view />
      </q-page-container>
    </div>

  </q-layout>
</template>

<script>
import Search from 'src/components/SearchToolbar.vue';
export default {
  name: "MainLayout",
  components: { Search },
  data(){
    return{
      mainnet : process.env.NETWORK_EVM_ENDPOINT == "https://mainnet.telos.net" ? true : false,
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
  padding: 1rem;
  max-width: 100%;
}
</style>
