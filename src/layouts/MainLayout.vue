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

        <connect-button/>
        <q-btn flat @click="drawer = !drawer" round dense icon="menu" />

      </q-toolbar>
    </q-header>

    <q-drawer
      side="right"
      v-model="drawer"
      :width="200"
      :breakpoint="500"
      overlay
      bordered
    >
      <q-list>
        <q-item
          clickable
          v-close-popup
          @click.native="routerTo('/endpoints')"
        >
          <q-item-section>
            <q-item-label>RPC Endpoints</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-if="!mainnet"
          clickable
          v-close-popup
          @click.native="goTo('https://teloscan.io/')"
        >
          <q-item-section>
            <q-item-label> Teloscan Mainnet </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          v-if="mainnet"
          clickable
          v-close-popup
          @click.native="goTo('https://testnet.teloscan.io/')"
        >
          <q-item-section>
            <q-item-label> Teloscan Testnet </q-item-label>
          </q-item-section>
        </q-item>

      </q-list>
    </q-drawer>

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
import ConnectButton from "components/ConnectButton";
import {mapGetters} from "vuex";

export default {
  name: "MainLayout",
  components: { Search, ConnectButton, FooterMain },
  data() {
    return {
      mainnet: process.env.NETWORK_EVM_CHAIN_ID === "40",
      accountConnected: false,
      drawer: false
    };
  },
  async mounted(){
    this.removeOldAngularCache();
  },
  computed: {
    ...mapGetters('login', [
      'isLoggedIn',
      'isNative',
      'address',
      'nativeAccount'
    ]),
    onHomePage() {
      return this.$route.name === "home";
    }
  },
  methods: {
    getLoginDisplay() {
      if (this.isLoggedIn)
        return this.isNative ? this.nativeAccount : this.address;
    },

    toggleDarkMode() {
      this.$q.dark.toggle();
      localStorage.setItem("darkModeEnabled", this.$q.dark.isActive);
    },
    goTo(url) {
      window.open(url, "_blank");
      this.drawer = false;
    },
    routerTo(path) {
      this.$router.push(path);
      this.drawer = false;
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
  },
  created() {
    this.$q.dark.set(localStorage.getItem("darkModeEnabled") !== "false");
  }
};
</script>

<style lang="sass" scoped>
.banner
  z-index: -1
  height: 280px
  position: absolute
  left: 0
  right: 0
  top: 0
  background: linear-gradient(#252a5e 27.19%, #2d4684 65.83%)
  &.home
    height: 400px

.connection
  font-size: .5rem
  margin-right: 0.2rem

.account
  width: 120px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

</style>
