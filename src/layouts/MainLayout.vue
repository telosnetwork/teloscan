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

        <search class="taskbarSearch desktop-only text-center " :toolbar="true" ></search>

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

            <q-icon name='circle' class='connection' :style="{ color: accountConnected ? '#7FFF00' : 'red'}"></q-icon>
            <span class='account'>{{ accountConnected ? accountConnected : mainnet ? "Mainnet" : "Testnet" }}</span>
          </template>

          <q-list>
            <q-item
              :disabled='accountConnected'
              clickable
              v-close-popup
              @click.native="connectAccount()"
            >
              <q-item-section>
                <q-item-label> {{ accountConnected ?  `Connected to ${mainnet ? "Mainnet" : "Testnet"}` : 'Connect Account' }}</q-item-label>
              </q-item-section>
            </q-item>

            <q-item-label header>Select Network</q-item-label>

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
  getProvider
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
      const connection = await this.switchEthereumChain();
      if (connection !== false) {
        this.accountConnected = await this.requestAccounts();
        this.addAccountsListener();
        this.$router.push(`/address/${this.accountConnected}`);
      }else{
        this.$q.notify({ position: 'top', type: 'warning', message: 'No provider detected. Enable an ethereum provider such as MetaMask to connect account.'})
      }
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
    this.removeOldAngularCache();
  },
  removeOldAngularCache() {
    // the old hyperion explorer hosted at teloscan.io had this stubborn cache that won't go away on it's own, this should remove it
    if(window.navigator && navigator.serviceWorker) {
      navigator.serviceWorker.getRegistrations()
        .then(function(registrations) {
          for(let registration of registrations) {
            registration.unregister();
          }
        });
    }
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

.account {
  width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>
