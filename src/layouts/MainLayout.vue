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
                        <div class="logo-container">
                            <img
                                alt="Telos EVM logo"
                                src="~assets/evm_logo.png"
                                width="45"
                                class="logo-image"
                            >
                            <span v-if="!mainnet" class="logo-label-testnet">
                                Testnet
                            </span>
                        </div>

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

                <connect-button class="connect-button" />

                <q-btn-dropdown
                    dropdown-icon="menu"
                    class="q-ml-sm"
                    dense
                    round
                    flat
                >
                    <q-list>
                        <q-item
                            v-close-popup
                            clickable
                            @click="routerTo('/staking')"
                            class="separator"
                        >
                            <q-item-section>
                                <q-item-label class="flex items-center"><img class="grayscale" :src="stlosLogo" width="14" /> <span class="q-pl-sm">{{  $t('layouts.stake_telos') }}</span> </q-item-label>
                            </q-item-section>
                        </q-item>
                        <q-item
                            v-close-popup
                            clickable
                            @click="routerTo('/health')"
                        >
                            <q-item-section>
                                <q-item-label class="flex items-center"><q-icon name="monitor_heart" /> <span class="q-pl-sm">{{  $t('layouts.health_status') }}</span> </q-item-label>
                            </q-item-section>
                        </q-item> 
                        <q-item
                            v-if="!mainnet"
                            v-close-popup
                            clickable
                            @click="goTo('https://teloscan.io/')"
                        >
                            <q-item-section>
                                <q-item-label class="flex items-center"><q-icon name="swap_horiz" />  <span class="q-pl-sm">{{  $t('layouts.teloscan_mainnet') }}</span> </q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item
                            v-if="mainnet"
                            v-close-popup
                            clickable
                            @click="goTo('https://testnet.teloscan.io/')"
                        >
                            <q-item-section>
                                <q-item-label class="flex items-center"><q-icon name="swap_horiz" />  <span class="q-pl-sm">{{  $t('layouts.teloscan_testnet') }}</span> </q-item-label>
                            </q-item-section>
                        </q-item>
                    </q-list>
                </q-btn-dropdown>
            </q-toolbar>

        </q-header>


    </div>
    <div
        :class="{
            'banner': true,
            'home': onHomePage,
            'testnet': !mainnet
        }"
    />

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
import ConnectButton from 'src/components/ConnectButton';
import { stlos } from 'src/lib/logos.js';

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
            stlosLogo: stlos,
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

<style lang="sass" scoped>
.separator
  border-bottom: 1px solid lightgrey

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
  &.testnet
    background: linear-gradient(180deg, rgb(35, 25, 94) 0%, rgb(68, 69, 136) 60%, transparent 99%)

.connection
  font-size: .5rem
  margin-right: 0.2rem

.q-item
    .q-icon
        transition: 400ms color ease

.q-item:hover
    .grayscale
        filter: grayscale(0)
    .q-icon
        color: $secondary

.account
  width: 120px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.q-header
  position: relative

body.body--light .q-drawer
 color: black

.connect-button
    background: #282828
    color: #ffffff
    border-radius: 5px

body.body--light .connect-button
    background: #ffffff
    color: black

.logo-container
    height: 45px
    width: 45px
    position: relative

.logo-image, .logo-label-testnet
    position: absolute
    top: 0
    right: 0
    bottom: 0
    left: 0
    margin: auto

.logo-label-testnet
    height: min-content
    color: white
    text-align: center
    font-size: 10px
    border-radius: 4px
    background-color: rgba($dark, 0.6)

@media screen and (max-width: 768px)
    .taskbarSearch
        display: none
    .q-drawer
        margin-top: 50px
@media only screen and (max-width: 550px)
    .q-btn-dropdown.q-ml-sm
        margin-left: 0
        padding: 4px 0px 4px 8px

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
