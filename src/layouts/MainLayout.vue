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
<q-layout view="lhh Lpr lFf" class="c-main-layout">
    <div class="c-main-layout__background-container">
        <div class="c-main-layout__background-top">
            <div class="c-main-layout__background-circle c-main-layout__background-circle--1"></div>
            <div class="c-main-layout__background-circle c-main-layout__background-circle--2"></div>
        </div>
        <div class="c-main-layout__background-bottom"></div>
    </div>

    <q-page-container class="flex flex-center page-container">
        <router-view />
    </q-page-container>
    <FooterMain />
    <transition
        appear
        enter-active-class="animated fadeIn"
        leave-active-class="animated fadeOut"
    >
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

<style lang="scss" scoped>

.c-main-layout {
    --faint-circle-color: rgba(255, 255, 255, 0.1);

    body.body--dark & {
        --faint-circle-color: rgba(100, 100, 100, 0.1);
    }

    &__background-container {
        position: fixed;
        z-index: -1;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;

        body.body--dark & {
            background-color: darken($dark, 5%);
            opacity: 0.4;
        }
    }

    &__background-top,
    &__background-bottom {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        background-position: center center;
        background-size: 100% auto;
        background-repeat: no-repeat;
    }

    &__background-top {
        top: 0;
        height: 30vh;
        overflow: hidden;
        background-image:
            radial-gradient(circle at 0% 150%, $primary, transparent 40%),
            radial-gradient(circle at 100% 100%, $primary, transparent 39%),
            radial-gradient(circle at 100% 0%, $secondary, transparent 40%),
            radial-gradient(circle at 65% 21%, $accent, transparent 40%);

        @media screen and (min-width: $breakpoint-sm-min) {
            background-image:
                radial-gradient(circle at 0% 120%, $primary, transparent 25%),
                radial-gradient(circle at 100% 100%, $primary, transparent 25%),
                radial-gradient(circle at 100% 0%, $secondary, transparent 25%),
                radial-gradient(circle at 75% 10%, $accent, transparent 25%);
        }

        @media screen and (min-width: $breakpoint-md-min) {
            background-image:
                radial-gradient(circle at 0% 150%, $primary, transparent 20%),
                radial-gradient(circle at 100% 100%, $primary, transparent 20%),
                radial-gradient(circle at 100% 0%, $secondary, transparent 25%),
                radial-gradient(circle at 70% -10%, $accent, transparent 30%);
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            background-image:
                radial-gradient(circle at 0% 150%, $primary, transparent 20%),
                radial-gradient(circle at 100% 100%, $primary, transparent 18%),
                radial-gradient(circle at 100% 0%, $secondary, transparent 22%),
                radial-gradient(circle at 75% -10%, $accent, transparent 20%)
        }
    }

    &__background-bottom {
        top: 30vh;
        height: 70vh;

        background-image:
            radial-gradient(circle at 100% 83%, $accent, transparent 30%),
            radial-gradient(circle at 72% 90%, $secondary, transparent 36%);

        @media screen and (min-width: $breakpoint-md-min) {
            background-image:
                radial-gradient(circle at 100% 83%, $accent, transparent 20%),
                radial-gradient(circle at 80% 90%, $secondary, transparent 25%);
        }
    }

    &__background-circle {
        position: absolute;
        content: "";
        border-radius: 100%;
        border: 24px solid var(--faint-circle-color);

        &--1 {
            top: -5vh;
            right: -20vh;
            width: 40vh;
            height: 40vh;
        }

        &--2 {
            display: none;

            @media screen and (min-width: $breakpoint-md-min) {
                display: block;
                top: -50%;
                right: 0;
                left: 0;
                width: 40vh;
                height: 40vh;
                margin: 0 auto;
            }
        }
    }
}
.page-container {
  margin-top: 48px;
  @media screen and (min-width: $breakpoint-lg-min) {
    margin-top: 105px;
  }
}

.separator {
  border-bottom: 1px solid lightgrey;
}

.connection {
  font-size: .5rem;
  margin-right: 0.2rem;
}

.q-item {
  .q-icon {
    transition: 400ms color ease;
  }
}

.q-item:hover {
  .grayscale {
    filter: grayscale(0);
  }
  .q-icon {
    color: $secondary;
  }
}

.account {
  width: 96px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.q-header {
  position: relative;
}

@media only screen and (max-width: 400px) {
  #logo {
    .text-h5 {
      font-size: 1.1rem;
    }
    img {
      width: 24px;
    }
  }
}

</style>
