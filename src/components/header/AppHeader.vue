<!-- eslint-disable max-len -->
<script lang="ts">
import { mapGetters, mapMutations } from 'vuex';
import { stlos as stlosLogo } from 'src/lib/logos.js';
import { directive as clickaway } from 'vue3-click-away';
import HeaderSearch from 'components/header/HeaderSearch.vue';
import LanguageSwitcherModal from 'components/header/LanguageSwitcherModal.vue';
import LoginModal from 'components/LoginModal.vue';
import LoginStatus from 'components/header/LoginStatus.vue';
import { RouteLocationRaw } from 'vue-router';
import { useAccountStore } from 'src/antelope';
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'AppHeader',
    components: {
        LanguageSwitcherModal,
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
        showLanguageSwitcher: false,
        advancedMenuExpanded: false,
        menuHiddenDesktop: false,
        searchHiddenMobile: true,
        isTestnet: Number(process.env.NETWORK_EVM_CHAIN_ID) !== 40,

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
        scrollHandler(info: { direction: string; }) {
            this.menuHiddenDesktop = info.direction === 'down';
        },
        goTo(to: RouteLocationRaw) {
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
            localStorage.setItem('darkModeEnabled', this.$q.dark.isActive.toString());

        },
        handleLoginLogout() {
            if (this.isLoggedIn) {
                this.logout();
            } else {
                this.showLoginModal = true;
            }
        },
        logout() {
            const loginData = localStorage.getItem('loginData');
            if (this.isNative) {
                if (!loginData) {
                    return;
                }
                const loginObj = JSON.parse(loginData);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const wallet = this.$ual.getAuthenticators().availableAuthenticators.find(a => a.getName() === loginObj.provider);
                wallet?.logout();
            }
            useAccountStore().logout();
            this.setLogin({});
            localStorage.removeItem('loginData');
            this.$providerManager.setProvider(null);
        },
    },
});
</script>

<template>
<header v-clickaway="handleClickaway" class="c-header shadow-2">
    <router-link to="/" class="c-header__logo-container u-flex--left">
        <div class="c-header__logo-image-container">
            <img
                alt="Telos EVM logo"
                src="/branding/telos-scan.png"
                width="32"
            >
            <div v-if="isTestnet" class="c-header__testnet-indicator">
                Testnet
            </div>
        </div>

        <span
            :class="{
                'c-header__logo-text': true,
                'c-header__logo-text--hidden-mobile': !searchHiddenMobile,
            }"
        >
            Teloscan
        </span>
    </router-link>

    <div class="c-header__right-container">
        <div class="c-header__search-container">
            <HeaderSearch @hidden-mobile="searchHiddenMobile = $event" />
        </div>

        <div class="c-header__menu-icon-container" @click="mobileMenuIsOpen = !mobileMenuIsOpen">
            <q-icon
                :name="mobileMenuIsOpen ? 'menu_open' : 'menu'"
                size="24px"
            />
        </div>

        <div v-if="isLoggedIn" class="c-header__login-status-desktop">
            <LoginStatus @navigated="mobileMenuIsOpen = false" />
        </div>
    </div>

    <div
        :class="{
            'c-header__menu-container': true,
            'c-header__menu-container--expanded-mobile': mobileMenuIsOpen,
            'c-header__menu-container--hidden-desktop': menuHiddenDesktop,
        }"
    >
        <ul class="c-header__menu-ul" role="menu">
            <li v-if="isLoggedIn" class="c-header__menu-li c-header__menu-li--login-status">
                <LoginStatus :is-logged-in="isLoggedIn" @navigated="mobileMenuIsOpen = false" />
            </li>

            <li
                class="c-header__menu-li"
                tabindex="0"
                role="menuitem"
                :aria-label="isLoggedIn ? 'logout' : 'login'"
                @keydown.enter="handleLoginLogout"
                @click="handleLoginLogout"
            >
                <q-icon
                    :name="isLoggedIn ? 'logout' : 'login'"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                {{ isLoggedIn ? $t('components.disconnect') : $t('components.connect_wallet') }}
            </li>

            <q-separator class="c-header__menu-separator"/>

            <li
                class="c-header__menu-li cursor-pointer"
                tabindex="0"
                role="link"
                :arial-label="$t('components.header.goto_staking')"
                @keydown.enter="goTo({ name: 'staking' })"
                @click="goTo({ name: 'staking' })"
            >
                <img
                    alt="STLOS logo"
                    :src="stlosLogo"
                    class="c-header__menu-item-icon c-header__menu-item-icon--stlos"
                    width="24"
                >
                {{ $t('components.header.liq_staking') }}
            </li>

            <q-separator class="c-header__menu-separator"/>

            <li
                class="c-header__menu-li"
                tabindex="0"
                aria-label="expand advanced menu"
                role="menuitem"
                aria-haspopup="menu"
                @keydown.enter="advancedMenuExpanded = !advancedMenuExpanded"
                @click="advancedMenuExpanded = !advancedMenuExpanded"
            >
                <q-icon
                    name="code"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                <div class="c-header__advanced-container">
                    <div class="c-header__advanced-container-header">
                        {{ $t('components.header.advanced') }}

                        <q-icon
                            :name="advancedMenuExpanded ? 'expand_less' : 'expand_more'"
                            class="c-header__menu-item-icon c-header__menu-item-icon--chevron"
                            size="sm"
                        />
                    </div>
                    <ul v-if="advancedMenuExpanded" class="c-header__advanced-menu-desktop">
                        <li
                            class="c-header__menu-li"
                            tabindex="0"
                            role="menuitem"
                            :aria-label="'open language switcher'"
                            @keydown.enter="showLanguageSwitcher = true"
                            @click="showLanguageSwitcher = true"
                        >
                            <q-icon
                                name="language"
                                class="c-header__menu-item-icon"
                                size="sm"
                            />
                            {{ $t('global.language') }}
                        </li>
                        <li
                            class="c-header__menu-li"
                            tabindex="0"
                            :aria-label="`${$t('components.header.goto_health_monitor')}`"
                            role="link"
                            @keydown.enter="goTo('/health')"
                            @click="goTo('/health')"
                        >
                            <q-icon
                                name="monitor_heart"
                                class="c-header__menu-item-icon"
                                size="sm"
                            />
                            {{ $t('components.header.health_monitor') }}

                        </li>
                        <li
                            class="c-header__menu-li"
                            tabindex="0"
                            role="link"
                            :aria-label="isTestnet ? $t('components.header.goto_mainnet') :
                                $t('components.header.goto_testnet')
                            "
                            @keydown.enter="goTo(isTestnet ? 'https://teloscan.io' : 'https://testnet.teloscan.io')"
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
                <li
                    class="c-header__menu-li c-header__menu-li--advanced-menu-mobile"
                    tabindex="0"
                    role="menuitem"
                    :aria-label="'open language switcher'"
                    @keydown.enter="showLanguageSwitcher = true"
                    @click="showLanguageSwitcher = true"
                >
                    <q-icon
                        name="language"
                        class="c-header__menu-item-icon"
                        size="sm"
                    />
                    {{ $t('global.language') }}
                </li>
                <li
                    class="c-header__menu-li c-header__menu-li--advanced-menu-mobile"
                    tabindex="0"
                    :aria-label="$t('components.header.goto_health_monitor')"
                    role="link"
                    @keydown.enter="goTo('/health')"
                    @click="goTo('/health')"
                >
                    <q-icon
                        name="monitor_heart"
                        class="c-header__menu-item-icon"
                        size="sm"
                    />
                    {{ $t('components.header.health_status') }}
                </li>
                <li
                    class="c-header__menu-li c-header__menu-li--advanced-menu-mobile"
                    tabindex="0"
                    :aria-label="`go to ${isTestnet ? 'main net' : 'test net'}`"
                    role="link"
                    @keydown.enter="goTo(isTestnet ? 'https://teloscan.io' : 'https://testnet.teloscan.io')"
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

            <li
                class="c-header__menu-li"
                tabindex="0"
                aria-label="enable dark theme"
                role="switch"
                :aria-checked="$q.dark.isActive"
                @keydown.enter="toggleDarkMode"
                @click="toggleDarkMode"
            >
                <q-icon
                    :name="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
                    class="c-header__menu-item-icon"
                    size="sm"
                />
                {{ $q.dark.isActive ? $t('components.header.light_mode') : $t('components.header.dark_mode') }}
            </li>
        </ul>
    </div>
</header>
<LoginModal :show="showLoginModal" @hide="showLoginModal = false" />
<LanguageSwitcherModal :show="showLanguageSwitcher" @hide="showLanguageSwitcher = false" />
<q-scroll-observer @scroll="scrollHandler" />
</template>
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

        @media screen and (min-width: $breakpoint-lg-min) {
            height: 64px;
            gap: 12px;
            color: var(--text-color);
            font-size: 18px;
        }
    }

    &__logo-image-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    &__testnet-indicator {
        position: absolute;
        top: 0;
        bottom: 0;
        margin: auto;
        font-size: 10px;
        height: min-content;
        padding: 0 2px;
        border-radius: 2px;
        background: rgba($dark, 0.4);
        color: white;
    }

    &__logo-text {
        color: var(--text-color);
        font-size: 18px;
        margin-left: 12px;

        &--hidden-mobile {
            display: none;
        }

        @media screen and (min-width: $breakpoint-lg-min) {
            display: block;
            margin-left: 0;
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
        box-shadow:
            0 4px 5px rgba(0, 0, 0, 0.2),
            0 2px 2px rgba(0, 0, 0, 0.14),
            0 3px 1px -2px rgba(0, 0, 0, 0.12);

        display: none;

        @media screen and (min-width: $breakpoint-lg-min) {
            display: block;
            top: 64px;
            transform: translateY(0);
            transition:
                0.3s ease transform,
                0.3s ease box-shadow,
                0.1s ease opacity;
            z-index: -1;
            opacity: 1;

            &--hidden-desktop {
                opacity: 0;
                transform: translateY(-128px);
                box-shadow: none;
            }
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

            & > #{$this}__menu-item-icon:not(#{$this}__menu-item-icon--chevron) {
                filter: grayscale(0);
                color: $secondary;
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
