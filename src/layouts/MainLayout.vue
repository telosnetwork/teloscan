<template>
<q-layout view="lhh Lpr lFf ">
    <div class="pageContainer">
        <q-header class="transparent pageContainer">
            <q-toolbar class="text-white toolbar transparent">
                <div class="q-py-sm">
                    <router-link
                        to="/"
                        id="logo"
                        class="row items-center q-gutter-x-xs"
                    >
                        <img
                            alt="Telos EVM logo"
                            src="~assets/evm_logo.png"
                            width="45"
                        >
                        <div class="text-h5 text-white">
                            Teloscan
                        </div>
                    </router-link>
                </div>
                <q-space />

                <search
                    class="taskbarSearch desktop-only text-center "
                    :toolbar="true"
                />

                <q-btn
                    id="dark-mode-toggle"
                    flat
                    dark
                    standout
                    class="q-px-md"
                    :icon="$q.dark.isActive ? 'fas fa-sun' : 'fas fa-moon'"
                    @click="toggleDarkMode()"
                />

                <connect-button />
                <q-btn
                    flat
                    round
                    dense
                    icon="menu"
                    @click="toggleDrawer"
                />
            </q-toolbar>
            <q-drawer
                v-click-away="handleClickaway"
                v-model="drawer"
                side="right"
                :width="200"
                :breakpoint="500"
                overlay
                bordered
            >
                <q-list>
                    <q-item
                        v-close-popup
                        clickable
                        @click="routerTo('/endpoints')"
                    >
                        <q-item-section>
                            <q-item-label>RPC Endpoints</q-item-label>
                        </q-item-section>
                    </q-item>

                    <q-item
                        v-if="!mainnet"
                        v-close-popup
                        clickable
                        @click="goTo('https://teloscan.io/')"
                    >
                        <q-item-section>
                            <q-item-label>Teloscan Mainnet</q-item-label>
                        </q-item-section>
                    </q-item>

                    <q-item
                        v-if="mainnet"
                        v-close-popup
                        clickable
                        @click="goTo('https://testnet.teloscan.io/')"
                    >
                        <q-item-section>
                            <q-item-label> Teloscan Testnet </q-item-label>
                        </q-item-section>
                    </q-item>
                    <q-item
                        v-close-popup
                        clickable
                        @click="routerTo('/staking')"
                    >
                        <q-item-section>
                            <q-item-label> Stake Telos </q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
            </q-drawer>
        </q-header>


    </div>
    <div :class="`banner ${onHomePage ? 'home' : ''}`" />

    <q-page-container class="flex flex-center">
        <router-view />
    </q-page-container>
    <footer-main />
</q-layout>
</template>

<script>
import { mapGetters } from 'vuex';
import { directive as ClickAway } from 'vue3-click-away';

import Search from 'src/components/Search.vue';
import FooterMain from 'src/components/Footer.vue';
import ConnectButton from 'components/ConnectButton';

export default {
    name: 'MainLayout',
    directives: {
        ClickAway,
    },
    components: {
        Search,
        ConnectButton,
        FooterMain,
    },
    data() {
        return {
            mainnet: '' + process.env.NETWORK_EVM_CHAIN_ID + '' === '40',
            accountConnected: false,
            drawer: false,
            clickawayDisabled: false,
        };
    },
    computed: {
        ...mapGetters('login', [
            'isLoggedIn',
            'isNative',
            'address',
            'nativeAccount',
        ]),
        onHomePage() {
            return this.$route.name === 'home';
        },
    },
    async mounted(){
        this.removeOldAngularCache();
    },
    created() {
        this.$q.dark.set(localStorage.getItem('darkModeEnabled') !== 'false');
    },
    methods: {
        getLoginDisplay() {
            if (this.isLoggedIn)
                return this.isNative ? this.nativeAccount : this.address;
        },

        toggleDarkMode() {
            this.$q.dark.toggle();
            localStorage.setItem('darkModeEnabled', this.$q.dark.isActive);
        },
        goTo(url) {
            window.open(url, '_blank');
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
        },
        toggleDrawer() {
            if (!this.drawer) {
                // handle race condition between vmodel and clickaway.
                // without this, because clickaway is instantly triggered when clicking the menu icon,
                // the drawer re-closes before it has had a chance to open
                this.clickawayDisabled = true;
                setTimeout(
                    () => { this.clickawayDisabled = false; },
                    400,
                )
            }
            this.drawer = !this.drawer;
        },
        handleClickaway() {
            if (this.drawer === true && !this.clickawayDisabled)
                this.drawer = false;
        },
    },
};
</script>

<style lang="sass">
.banner
  z-index: -1
  height: 40vh
  position: absolute
  left: 0
  right: 0
  top: 0
  background: linear-gradient(180deg, rgb(37,42,94) 0%, rgba(45,70,132) 60%, transparent 99%)
  &.home
    height: 50vh

.connection
  font-size: .5rem
  margin-right: 0.2rem

.account
  width: 120px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.q-header
  position: relative

.q-drawer-container
  border-radius: 0px 0px 15px 15px

body.body--light .q-drawer
 color: black

.q-drawer
  position: absolute !important
  height: 150px
  border-radius: 0px 0px 15px 15px

@media screen and (max-width: 768px)
    .taskbarSearch
        display: none
    .q-drawer
        margin-top: 50px
@media only screen and (max-width: 550px)
    #dark-mode-toggle
        padding-right: 5px
        .q-icon
            font-size: 1.3em
    #logo
        .text-h5
            font-size: 1.3rem
        img
            width: 32px

@media only screen and (max-width: 400px)
    #logo
        .text-h5
            font-size: 1.1rem
        img
            width: 24px
</style>
