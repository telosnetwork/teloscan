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
            {{ mainnet ? "Mainnet" : "Testnet" }}
          </template>

          <q-list style="width : 200px">
            <q-item
              clickable
              v-close-popup
              @click.native="addNetwork()"
            >
              <q-item-section>
                <q-item-label> {{ `Add to Metamask` }} </q-item-label>
              </q-item-section>
            </q-item>

            <q-item-label header>Network</q-item-label>

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
export default {
  name: "MainLayout",
  components: { Search,FooterMain },
  data() {
    return {
      mainnet: process.env.NETWORK_EVM_CHAIN_ID === "40"
    };
  },
  computed: {
    onHomePage() {
      return this.$route.name === "home";
    }
  },
  mounted() {
    this.removeOldAngularCache();
  },
  methods: {
    toggleDarkMode() {
      this.$q.dark.toggle();
      localStorage.setItem("darkModeEnabled", this.$q.dark.isActive);
    },
    goTo(url) {
      window.open(url, "_blank");
    },
    removeOldAngularCache() {
      // the old hyperion explorer hosted at teloscan.io had this stubborn cache that won't go away on it's own, this should remove it
      if(window.navigator && navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations()
          .then(function (registrations) {
            for (let registration of registrations) {
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
</style>
