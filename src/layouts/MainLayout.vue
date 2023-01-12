<template>
<app-header />
<q-layout view="lhh Lpr lFf ">
    <div :class="`banner ${onHomePage ? 'home' : ''}`" />

    <q-page-container class="flex flex-center page-container">
        <router-view />
    </q-page-container>
    <footer-main />
</q-layout>
</template>

<script>
import { mapGetters } from 'vuex';

import AppHeader from 'components/header/AppHeader.vue';
import FooterMain from 'components/Footer.vue';

import { stlos } from 'src/lib/logos.js';

export default {
    name: 'MainLayout',
    components: {
        AppHeader,
        FooterMain,
    },
    data() {
        return {
            stlosLogo: stlos,
            mainnet: '' + process.env.NETWORK_EVM_CHAIN_ID + '' === '40',
            accountConnected: false,
            drawer: false,
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
    },
};
</script>

<style lang="sass" scoped>
.page-container
    margin-top: 48px
    @media screen and (min-width: $breakpoint-lg-min)
        margin-top: 96px


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
