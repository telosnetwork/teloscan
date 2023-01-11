<template>
<header class="c-header shadow-2">
    <div class="c-header__logo-container u-flex--left">
        <img
            alt="Telos EVM logo"
            src="~assets/evm_logo.png"
            width="32"
        >
    </div>

    <div class="c-header__right-container">
        <div class="c-header__search-container">
            <q-icon
                name="search"
                size="24px"
            />
        </div>

        <div class="c-header__menu-icon-container" @click="mobileMenuIsOpen = !mobileMenuIsOpen">
            <q-icon
                :name="mobileMenuIsOpen ? 'menu_open' : 'menu'"
                size="24px"
            />
        </div>

        <div class="c-header__login-status-desktop">
            <login-status :is-logged-in="loggedIn" />
        </div>
    </div>

    <div
        :class="{
            'c-header__menu-container': true,
            'c-header__menu-container--expanded-mobile': mobileMenuIsOpen,
        }"
    >
        <ul class="c-header__menu-ul">
            <li v-if="loggedIn" class="c-header__menu-li c-header__menu-li--login-status">
                <login-status :is-logged-in="loggedIn" />
            </li>

            <li class="c-header__menu-li">
                <q-icon
                    :name="loggedIn ? 'logout' : 'login'"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                Sign {{ loggedIn ? 'Out' : 'In'}}
            </li>

            <q-separator class="c-header__menu-separator"/>

            <li class="c-header__menu-li">
                <img
                    alt="STLOS logo"
                    :src="stlosLogo"
                    class="c-header__menu-item-icon c-header__menu-item-icon--stlos"
                    width="24"
                >
                Liquid Staking
            <!--    eztodo switch to stlos icon-->
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
                </div>
            </li>

            <template v-if="advancedMenuExpanded">
                <li class="c-header__menu-li q-pl-lg">
                    <q-icon
                        name="http"
                        class="c-header__menu-item-icon"
                        size="sm"
                    />
                    RPC Endpoints
                </li>
                <li class="c-header__menu-li q-pl-lg">
                    <q-icon
                        name="monitor_heart"
                        class="c-header__menu-item-icon"
                        size="sm"
                    />
                    Telos Monitor
                </li>
                <li class="c-header__menu-li q-pl-lg">
                    <q-icon
                        name="sync_alt"
                        class="c-header__menu-item-icon"
                        size="sm"
                    />
                    Teloscan {{ isTestnet ? 'Mainnet' : 'Testnet' }}
                </li>
            </template>

            <q-separator class="c-header__menu-separator"/>

            <li class="c-header__menu-li">
                <q-icon
                    :name="isDarkMode ? 'light_mode' : 'dark_mode'"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                {{ isDarkMode ? 'Light' : 'Dark'}} Mode
            </li>
        </ul>
    </div>
</header>
</template>

<script>
import { stlos as stlosLogo } from 'src/lib/logos.js';

import LoginStatus from 'components/header/LoginStatus.vue';

export default {
    name: 'AppHeader',
    components: { LoginStatus },
    data: () => ({
        stlosLogo,
        mobileMenuIsOpen: false,
        loggedIn: true,
        isDarkMode: false,
        advancedMenuExpanded: false,
        isTestnet: false,
    }),

}
</script>

<style lang="scss">
.c-header {
    background-color: white;
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    height: 48px;
    padding: 0 0 0 16px;

    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;

    @media screen and (min-width: $breakpoint-lg-min) {
        height: 64px;
        padding: 0 24px;
    }

    &__logo-container {
        width: 48px;
        height: 48px;
        //display: flex;
        //justify-content: center;
        //align-items: center;
        @media screen and (min-width: $breakpoint-lg-min) {
            height: 64px;
        }
    }

    &__right-container {
        display: flex;
        flex-wrap: nowrap;
        height: 48px;
        @media screen and (min-width: $breakpoint-lg-min) {
            height: 64px;
        }
    }

    &__search-container {
        width: 48px;
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
        background-color: white;
        position: absolute;
        top: 48px;
        right: 0;
        left: 0;
        padding: 0 16px;
        width: 100%;

        display: none;

        @media screen and (min-width: $breakpoint-lg-min) {
            display: block;
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
        margin: 12px 0;
        display: flex;
        align-items: center;

        &--login-status {
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

        &--stlos {
            filter: grayscale(1);
        }
    }

    &__advanced-container {
        width: 100%;
    }

    &__advanced-container-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
    }
}
</style>
