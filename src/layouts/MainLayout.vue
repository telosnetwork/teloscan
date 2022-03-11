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
        <q-space />
        <!-- <q-btn stretch flat class="desktop-only" label="Blocks" /> -->

        <!-- <q-separator dark vertical class="desktop-only" />

        <q-btn stretch flat class="desktop-only" label="Transactions" to="/transactions" /> -->

        <!-- <q-separator dark vertical class="desktop-only" /> -->

        <search class="taskbarSearch desktop-only text-center " toolbar="true" ></search>

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
            <q-icon name='circle' class='connection' :style="{ color: accountConnected ? '#7FFF00' : 'red'}"></q-icon>  {{ mainnet ? "Mainnet" : "Testnet" }}
          </template>

          <q-list style="width : 200px">
            <q-item
              :disabled='accountConnected'
              clickable
              v-close-popup
              @click.native="connectAccount()"
            >
              <q-item-section>
                <q-item-label> Connect Account</q-item-label>
              </q-item-section>
            </q-item>
            <!-- <q-item
              v-else
              clickable
              v-close-popup
              @click.native="disconnectAccount()"
            >
              <q-item-section>
                <q-item-label> Disconnect Account</q-item-label>
              </q-item-section>
            </q-item> -->

            <q-item-label header>Select Network</q-item-label>

            <!-- <q-item
              v-close-popup
              @click.native="goTo('https://www.teloscan.io/')"
            >
              <q-item-section>
                <q-item-label> Mainnet </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              v-close-popup
              @click.native="goTo('https://testnet.teloscan.io/')"
            >
              <q-item-section>
                <q-item-label>Testnet</q-item-label>
              </q-item-section>
            </q-item> -->

            <q-item
              v-if="!mainnet"
              clickable
              v-close-popup
              @click.native="goTo('https://www.teloscan.io/')"
            >
              <q-item-section>
                <q-item-label> Mainnet </q-item-label>
              </q-item-section>
            </q-item>

            <q-item
              v-if="mainnet"
              clickable
              v-close-popup
              @click.native="goTo('https://testnet.teloscan.io/')"
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

    <div :class="`banner ${onHomePage ? 'home' : ''}`"></div>

    <q-page-container class="flex flex-center ">
      <router-view />
    </q-page-container>

    <footer-main/>

  </q-layout>
</template>

<script>
import Search from "src/components/Search.vue";
import FooterMain from "src/components/Footer.vue";
import { 
  switchEthereumChain, 
  isConnected, 
  requestAccounts, 
  getProvider,
  disconnectAccount
   } from 'src/lib/provider';
export default {
  name: "MainLayout",
  components: { Search,FooterMain },
  data() {
    return {
      mainnet: process.env.NETWORK_EVM_CHAIN_ID === "40",
      accountConnected: false
    };
  },
  async mounted(){
    this.accountConnected = await this.isConnected();
    if (this.accountConnected){
      this.addAccountsListener();
    }
  },
  computed: {
    onHomePage() {
      return this.$route.name === "home";
    }
  },
  methods: {
    getProvider,
    isConnected,
    requestAccounts,
    switchEthereumChain,
    disconnectAccount,
    addAccountsListener() {
      const provider = this.getProvider();
      provider.on('accountsChanged', (accountsArr) => {
        if (!accountsArr.length){
          this.accountConnected = false;
          provider.removeAllListeners('accountsChanged');
        }
      });
    },
    async connectAccount() {
      await this.switchEthereumChain();
      const connected = await this.requestAccounts();
      this.accountConnected = connected;
      this.addAccountsListener();
    },
    toggleDarkMode() {
      this.$q.dark.toggle();
      localStorage.setItem("darkModeEnabled", this.$q.dark.isActive);
    },
    goTo(url) {
      window.open(url, "_blank");
    }
  },
  created() {
    this.$q.dark.set(localStorage.getItem("darkModeEnabled") !== "false");
  }
};
</script>

<style lang="scss" scoped>
.banner {
  z-index: -1;
  height: 280px;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  background: linear-gradient(#252a5e 27.19%, #2d4684 65.83%);
  &.home {
    height: 400px;
  }
}
.connection {
  font-size: .5rem;
  margin-right: 0.2rem;
}
</style>
