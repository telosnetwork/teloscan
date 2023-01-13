<template>
<header v-clickaway="handleClickaway" class="c-header shadow-2">
    <router-link to="/" class="c-header__logo-container u-flex--left">
        <img
            alt="Telos EVM logo"
            src="~assets/evm_logo.png"
            width="32"
        >
        <span class="c-header--logo-text">Teloscan</span>
    </router-link>

    <div class="c-header__right-container">
        <div class="c-header__search-container">
            <header-search />
        </div>

        <div class="c-header__menu-icon-container" @click="mobileMenuIsOpen = !mobileMenuIsOpen">
            <q-icon
                :name="mobileMenuIsOpen ? 'menu_open' : 'menu'"
                size="24px"
            />
        </div>

        <div v-if="isLoggedIn" class="c-header__login-status-desktop">
            <login-status />
        </div>
    </div>

    <div
        :class="{
            'c-header__menu-container': true,
            'c-header__menu-container--expanded-mobile': mobileMenuIsOpen,
        }"
    >
        <ul class="c-header__menu-ul">
            <li v-if="isLoggedIn" class="c-header__menu-li c-header__menu-li--login-status">
                <login-status :is-logged-in="isLoggedIn" />
            </li>

            <li class="c-header__menu-li" @click="handleLoginLogout">
                <q-icon
                    :name="isLoggedIn ? 'logout' : 'login'"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                Sign {{ isLoggedIn ? 'Out' : 'In'}}
            </li>

            <q-separator class="c-header__menu-separator"/>

            <li class="c-header__menu-li cursor-pointer" @click="goTo({ name: 'staking' })">
                <img
                    alt="STLOS logo"
                    :src="stlosLogo"
                    class="c-header__menu-item-icon c-header__menu-item-icon--stlos"
                    width="24"
                >
                Liquid Staking
            </li>

            <q-separator class="c-header__menu-separator"/>

            <li class="c-header__menu-li">
                <q-icon
                    name="code"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                <div class="c-header__advanced-container">
                    <div class="c-header__advanced-container-header" @click="advancedMenuExpanded = !advancedMenuExpanded">
                        Advanced

                        <q-icon
                            :name="advancedMenuExpanded ? 'expand_less' : 'expand_more'"
                            class="c-header__menu-item-icon"
                            size="sm"
                        />
                    </div>
                    <ul v-if="advancedMenuExpanded" class="c-header__advanced-menu-desktop">
                        <li class="c-header__menu-li" @click="goTo('/health')">
                            <q-icon
                                name="monitor_heart"
                                class="c-header__menu-item-icon"
                                size="sm"
                            />
                            Health Status
                        </li>
                        <li
                            class="c-header__menu-li"
                            @click="goTo(isTestnet ? 'https://teloscan.io' : 'https://testnet.teloscan.io')"
                        >
                            <q-icon
                                name="sync_alt"
                                class="c-header__menu-item-icon"
                                size="sm"
                            />
                            Teloscan {{ isTestnet ? 'Mainnet' : 'Testnet' }}
                        </li>
                    </ul>
                </div>
            </li>

            <template v-if="advancedMenuExpanded">
                <li class="c-header__menu-li c-header__menu-li--advanced-menu-mobile" @click="goTo('/health')">
                    <q-icon
                        name="monitor_heart"
                        class="c-header__menu-item-icon"
                        size="sm"
                    />
                    Health Status
                </li>
                <li
                    class="c-header__menu-li c-header__menu-li--advanced-menu-mobile"
                    @click="goTo(isTestnet ? 'https://teloscan.io' : 'https://testnet.teloscan.io')"
                >
                    <q-icon
                        name="sync_alt"
                        class="c-header__menu-item-icon"
                        size="sm"
                    />
                    Teloscan {{ isTestnet ? 'Mainnet' : 'Testnet' }}
                </li>
            </template>

            <q-separator class="c-header__menu-separator"/>

            <li class="c-header__menu-li" @click="toggleDarkMode">
                <q-icon
                    :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                {{ $q.dark.isActive ? 'Light' : 'Dark'}} Mode
            </li>
        </ul>
    </div>
</header>
<login-modal :show="showLoginModal" @hide="showLoginModal = false" />
</template>

<script>
import { mapGetters, mapMutations } from 'vuex';
import { stlos as stlosLogo } from 'src/lib/logos.js';
import { directive as clickaway } from 'vue3-click-away';

import LoginModal from 'components/LoginModal.vue';
import HeaderSearch from 'components/header/HeaderSearch.vue';
import LoginStatus from 'components/header/LoginStatus.vue';

export default {
    name: 'AppHeader',
    components: {
        LoginModal,
        HeaderSearch,
        LoginStatus,
    },
    directives: {
        clickaway,
    },
    data: () => ({
        stlosLogo,
        mobileMenuIsOpen: false,
        showLoginModal: false,
        advancedMenuExpanded: false,
        isTestnet: process.env.NETWORK_EVM_CHAIN_ID !== '40',
    }),
    computed: {
        ...mapGetters('login', [
            'isLoggedIn',
            'isNative',
        ]),
    },
    methods: {
        ...mapMutations('login', [
            'setLogin',
        ]),
        goTo(to) {
            this.mobileMenuIsOpen = false;
            this.advancedMenuExpanded = false;

            const httpsRegex = /^https/;
            if (typeof to === 'string' && httpsRegex.test(to)) {
                window.location.href = to;
                return;
            }

            this.$router.push(to);
        },
        handleClickaway() {
            this.mobileMenuIsOpen = false;
            this.advancedMenuExpanded = false;
        },
        toggleDarkMode() {
            this.$q.dark.toggle();
            localStorage.setItem('darkModeEnabled', this.$q.dark.isActive);
        },
        handleLoginLogout() {
            if (this.isLoggedIn) {
                this.logout();
            } else {
                this.showLoginModal = true;
            }
        },
        logout() {
            if (this.isNative) {
                const loginData = localStorage.getItem('loginData');
                if (!loginData)
                    return;

                const loginObj = JSON.parse(loginData);
                const wallet = this.$ual.authenticators.find(a => a.getName() == loginObj.provider);
                wallet.logout();
            }

            this.setLogin({});
            localStorage.removeItem('loginData');
            this.$providerManager.setProvider(null);
        },
    },
}
</script>

<style lang="scss">
.c-header {
    $this: &;

    --background-color: white;
    --text-color: #{$dark};
    --highlight-color: #{$grey-3};

    background-color: var(--background-color);
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    height: 48px;
    padding: 0 0 0 16px;
    z-index: 999;
    color: var(--text-color);

    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;

    @media screen and (min-width: $breakpoint-lg-min) {
        height: 64px;
        padding: 0 24px;
    }

    @at-root .body--dark & {
        --background-color: #{$dark};
        --text-color: white;
        --highlight-color: #{$grey-9};
    }

    &__logo-container {
        width: 48px;
        height: 48px;
        //display: flex;
        //justify-content: center;
        //align-items: center;
        @media screen and (min-width: $breakpoint-lg-min) {
            height: 64px;
            gap: 12px;
            color: var(--text-color);
            font-size: 18px;
        }
    }

    &--logo-text {
        display: none;

        @media screen and (min-width: $breakpoint-lg-min) {
            display: block
        }
    }

    &__right-container {
        display: flex;
        flex-wrap: nowrap;
        height: 48px;

        @media screen and (min-width: $breakpoint-lg-min) {
            height: 64px;
            gap: 16px;
        }
    }

    &__search-container {
        //width: 48px;
        height: 48px;
        display: flex;
        justify-content: center;
        align-items: center;

        @media screen and (min-width: $breakpoint-lg-min) {
            height: 64px;
        }
    }

    &__login-status-desktop {
        display: none;

        @media screen and (min-width: $breakpoint-lg-min) {
            display: flex;
            align-items: center;
        }
    }

    &__menu-icon-container {
        width: 48px;
        height: 48px;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;

        @media screen and (min-width: $breakpoint-lg-min) {
            display: none;
        }
    }

    &__menu-container {
        background-color: var(--background-color);
        position: absolute;
        top: 48px;
        right: 0;
        left: 0;
        padding: 0 16px;
        width: 100%;
        box-shadow: 0 4px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);


        display: none;

        @media screen and (min-width: $breakpoint-lg-min) {
            display: block;
            top: 64px;
        }

        &--expanded-mobile {
            display: block;
        }
    }

    &__menu-ul {
        padding: 0;
        margin: 0;

        @media screen and (min-width: $breakpoint-lg-min) {
            display: flex;
            flex-direction: row-reverse;
            gap: 16px;
        }
    }

    &__menu-li {
        list-style: none;
        padding: 12px 0;
        display: flex;
        align-items: center;
        cursor: pointer;
        user-select: none;
        border-radius: 4px;

        &:hover,
        &:focus,
        &:active {
            @media screen and (min-width: $breakpoint-lg-min) {
                background-color: var(--highlight-color);
            }

            #{$this}__menu-item-icon {
                filter: grayscale(0);
            }
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            padding: 12px 16px;
        }

        &--login-status {
            cursor: default;

            @media screen and (min-width: $breakpoint-lg-min) {
                display: none;
            }
        }

        &--advanced-menu-mobile {
            margin-left: 24px;

            @media screen and (min-width: $breakpoint-lg-min) {
                display: none;
            }
        }
    }

    &__menu-separator {
        @media screen and (min-width: $breakpoint-lg-min) {
            display: none;
        }
    }

    &__menu-item-icon {
        margin-right: 8px;
        transition: 0.2s ease all;

        &--stlos {
            filter: grayscale(1);
        }
    }

    &__advanced-container {
        width: 100%;
        position: relative;
    }

    &__advanced-container-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
    }

    &__advanced-menu-desktop {
        display: none;

        @media screen and (min-width: $breakpoint-lg-min) {
            padding: 0;
            display: block;
            position: absolute;
            top: 36px;
            left: -48px;
            background-color: var(--background-color);
            width: max-content;
            border-radius: 0 0 4px 4px;
            box-shadow: 0 4px 5px rgba(0, 0, 0, 0.2), 0 2px 2px rgba(0, 0, 0, 0.14), 0 3px 1px -2px rgba(0, 0, 0, 0.12);
        }
    }
}
</style>
