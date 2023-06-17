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
            mainnet: process.env.NETWORK_EVM_CHAIN_ID === 40,
            accountConnected: false,
            drawer: false,
            scTimer: 0,
            scY: 0,
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
        window.addEventListener('scroll', this.handleScroll);
    },
    created() {
        this.$q.dark.set(localStorage.getItem('darkModeEnabled') !== 'false');
    },
    methods: {
        handleScroll: function () {
            if (this.scTimer){
                return;
            }
            this.scTimer = setTimeout(() => {
                this.scY = window.scrollY;
                clearTimeout(this.scTimer);
                this.scTimer = 0;
            }, 100);
        },
        toTop: function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        },
        removeOldAngularCache() {
            // the old hyperion explorer hosted at teloscan.io had this stubborn cache that won't go away on it's own,
            // this should remove it
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

<template>
<AppHeader />
<q-layout view="lhh Lpr lFf">
    <q-page-container class="flex flex-center page-container">
        <div :class="`banner ${onHomePage ? 'home' : ''}`" ></div>
        <router-view />
    </q-page-container>
    <FooterMain />
    <transition name="fade">
        <div
            v-show="scY > 300"
            id="pagetop"
            class="fixed fixed-bottom-right clickable"
            @click="toTop"
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#8294b4"
                stroke-width="1"
                stroke-linecap="square"
                stroke-linejoin="arcs"
            >
                <path d="M18 15l-6-6-6 6"/>
            </svg>
        </div>
    </transition>
</q-layout>
</template>

<style lang="sass" scoped>
.page-container
    margin-top: 48px
    @media screen and (min-width: $breakpoint-lg-min)
        margin-top: 105px


.separator
  border-bottom: 1px solid lightgrey
.body--dark .banner
    background: linear-gradient(180deg,#31387e,#172547 55%,#0000 99%)
.banner
  z-index: -1
  height: 55vh
  position: absolute
  left: 0
  right: 0
  top: 0
  background: linear-gradient(180deg, rgb(37,42,94) 0%, rgba(45,70,132) 60%, transparent 100%)
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
  width: 96px
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.q-header
  position: relative

@media only screen and (max-width: 400px)
    #logo
        .text-h5
            font-size: 1.1rem
        img
            width: 24px
</style>
