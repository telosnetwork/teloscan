<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';

import LanguageSwitcherModal from 'components/header/LanguageSwitcherModal.vue';
import AppHeaderButton from 'components/header/AppHeaderButton.vue';

const $router = useRouter();
const $route = useRoute();
const $q = useQuasar();


// eztodo i18n
const blockchainSubmenuItems = [
    { name: 'transactions', label: 'Transactions' },
    { name: 'blocks', label: 'Blocks' },
];

// eztodo handle testnet, use chain settings for links, i18n
const developersSubmenuItems = [
    { url: 'https://api.teloscan.io/swagger/', label: 'API Documentation' },
    { url: 'https://sourcify.dev/', label: 'Verify Contract (Sourcify)' },
];

// eztodo use chain settings for link, i18n
const walletMenuItem = {
    url: 'https://wallet.telos.net/',
    label: 'Telos Wallet',
};

// eztodo use chain settings, i18n
const moreSubmenuItems = {
    internal: [
        { name: 'export', label: 'CSV Export' },
    ],
    external: [
        {
            url: 'https://www.telos.net/ecosystem',
            label: 'Telos Ecosystem',
        },
    ],
};

// data
const menuBottomBarHidden = ref(false);
const showLanguageSwitcher = ref(false);
const menuVisibleMobile = ref(false);
const blockchainMenuExpandedMobile = ref(false);
const developersMenuExpandedMobile = ref(false);
const moreMenuExpandedMobile = ref(false);

// watchers
watch(() => $q.screen.gt.md, () => {
    // eztodo fix this
    menuVisibleMobile.value = false;
    blockchainMenuExpandedMobile.value = false;
    developersMenuExpandedMobile.value = false;
    moreMenuExpandedMobile.value = false;
});

// computed
const highlightBlockchainMenuItem = computed(() => blockchainSubmenuItems.some(({ name }) => name === $route.name));
const highlightMoreMenuItem = computed(() => moreSubmenuItems.internal.some(({ name }) => name === $route.name));


// methods
function scrollHandler(info: { direction: string; }) {
    menuBottomBarHidden.value = info.direction === 'down';
}

function blurActiveElement() {
    (document.activeElement as HTMLElement | null)?.blur();
}

function goTo(to: string | { name: string }) {
    // mobileMenuIsOpen.value = false;
    blurActiveElement();

    const httpsRegex = /^https/;
    if (typeof to === 'string' && httpsRegex.test(to)) {
        window.open(to, '_blank');
        return;
    }

    $router.push(to);
}
</script>

<template>
<!-- eztodo i18n and aria roles -->

<div
    :class="{
        'c-header-bottom-bar': true,
        'c-header-bottom-bar--hidden': menuBottomBarHidden,
    }"
>
    <div class="c-header-bottom-bar__inner-container">
        <router-link to="/" class="c-header-bottom-bar__logo-container">
            <div class="c-header-bottom-bar__logo-image-container">
                <img
                    alt="Telos EVM logo eztodo"
                    src="/branding/telos-scan.png"
                    height="32"
                >
            </div>

            <span class="c-header-bottom-bar__logo-text">
                Teloscan
            </span>
        </router-link>
        <!-- eztodo aria and kb and break into components -->
        <nav class="c-header-bottom-bar__right-container">
            <AppHeaderButton
                text-color="default"
                :icon-only="true"
                class="c-header-bottom-bar__menu-button"
                @click="menuVisibleMobile = !menuVisibleMobile"
            >
                <q-icon name="menu" size="24px" />
            </AppHeaderButton>

            <ul
                :class="{
                    'c-header-bottom-bar__menu-ul': true,
                    'c-header-bottom-bar__menu-ul--visible-mobile shadow-2': menuVisibleMobile && $q.screen.lt.md,
                }"
            >
                <li
                    :class="{
                        'c-header-bottom-bar__menu-li': true,
                        'c-header-bottom-bar__menu-li--current': $route.name === 'home',
                    }"
                    tabindex="0"
                    @click="goTo({ name: 'home' })"
                    @keydown.enter="goTo({ name: 'home' })"
                >
                    Home
                </li>

                <li
                    :class="{
                        'c-header-bottom-bar__menu-li c-header-bottom-bar__menu-li--expandable': true,
                        'c-header-bottom-bar__menu-li--current': highlightBlockchainMenuItem,
                        'c-header-bottom-bar__menu-li--expanded-mobile': blockchainMenuExpandedMobile,
                    }"
                    tabindex="0"
                    @mouseleave="blurActiveElement"
                    @click="blockchainMenuExpandedMobile = !blockchainMenuExpandedMobile"
                >
                    <div class="c-header-bottom-bar__menu-li-text">
                        Blockchain
                        <q-icon name="fas fa-chevron-down" size="12px" />
                    </div>

                    <ul
                        :class="{
                            'c-header-bottom-bar__submenu-ul': true,
                            'shadow-2': $q.screen.gt.md,
                        }"
                    >
                        <li
                            v-for="item in blockchainSubmenuItems"
                            :key="`blockchain-submenu-item-${item.name}`"
                            :class="{
                                'c-header-bottom-bar__submenu-li': true,
                                'c-header-bottom-bar__submenu-li--current': $route.name === item.name,
                            }"
                            tabindex="0"
                            @click="goTo({ name: item.name })"
                            @keydown.enter="goTo({ name: item.name })"
                        >
                            {{ item.label }}
                        </li>
                    </ul>
                </li>

                <li
                    :class="{
                        'c-header-bottom-bar__menu-li c-header-bottom-bar__menu-li--expandable': true,
                        'c-header-bottom-bar__menu-li--expanded-mobile': developersMenuExpandedMobile,
                    }"
                    tabindex="0"
                    @mouseleave="blurActiveElement"
                >
                    <div class="c-header-bottom-bar__menu-li-text">
                        Developers
                        <q-icon name="fas fa-chevron-down" size="12px" />
                    </div>

                    <ul class="c-header-bottom-bar__submenu-ul shadow-2">
                        <li
                            v-for="item in developersSubmenuItems"
                            :key="`developer-submenu-item-${item.label}`"
                            class="c-header-bottom-bar__submenu-li"
                            tabindex="0"
                            @click="goTo(item.url)"
                            @keydown.enter="goTo(item.url)"
                        >
                            <div class="u-flex--center-y">
                                {{ item.label }}
                                <q-icon name="fas fa-external-link-alt" size="12px" class="q-ml-sm" />
                            </div>
                        </li>
                    </ul>
                </li>

                <li
                    class="c-header-bottom-bar__menu-li"
                    tabindex="0"
                    @click="goTo(walletMenuItem.url)"
                    @keydown.enter="goTo(walletMenuItem.url)"
                >
                    {{ walletMenuItem.label }}
                </li>

                <li
                    :class="{
                        'c-header-bottom-bar__menu-li c-header-bottom-bar__menu-li--expandable': true,
                        'c-header-bottom-bar__menu-li--current': highlightMoreMenuItem,
                        'c-header-bottom-bar__menu-li--expanded-mobile': moreMenuExpandedMobile,
                    }"
                    tabindex="0"
                    @mouseleave="blurActiveElement"
                >
                    <div class="c-header-bottom-bar__menu-li-text">
                        More
                        <q-icon name="fas fa-chevron-down" size="12px" />
                    </div>

                    <ul class="c-header-bottom-bar__submenu-ul shadow-2">
                        <li
                            class="c-header-bottom-bar__submenu-li"
                            tabindex="0"
                            role="menuitem"
                            :aria-label="'eztodo'"
                            @keydown.enter="showLanguageSwitcher = true"
                            @click="showLanguageSwitcher = true"
                        >
                            <div class="u-flex--center-y">
                                {{ $t('global.language') }}
                                <q-icon name="fas fa-language" size="16px" class="q-ml-sm" />
                            </div>
                        </li>

                        <li
                            v-for="item in moreSubmenuItems.internal"
                            :key="`more-submenu-item-internal-${item.name}`"
                            :class="{
                                'c-header-bottom-bar__submenu-li': true,
                                'c-header-bottom-bar__submenu-li--current': $route.name === item.name,
                            }"
                            tabindex="0"
                            @click="goTo({ name: item.name })"
                            @keydown.enter="goTo({ name: item.name })"
                        >
                            {{ item.label }}
                        </li>

                        <li
                            v-for="item in moreSubmenuItems.external"
                            :key="`more-submenu-item-external-${item.label}`"
                            class="c-header-bottom-bar__submenu-li"
                            tabindex="0"
                            @click="goTo(item.url)"
                            @keydown.enter="goTo(item.url)"
                        >
                            <div class="u-flex--center-y">
                                {{ item.label }}
                                <q-icon name="fas fa-external-link-alt" size="12px" class="q-ml-sm" />
                            </div>
                        </li>
                    </ul>
                </li>
            </ul>
        </nav>
    </div>
</div>

<q-scroll-observer @scroll="scrollHandler" />

<LanguageSwitcherModal :show="showLanguageSwitcher" @hide="showLanguageSwitcher = false" />
</template>

<style lang="scss">
.c-header-bottom-bar {
    $this: &;
    padding: 0 12px;

    // other CSS vars defined in AppHeader.vue
    --highlight-color: #{$grey-3};

    @at-root .body--dark & {
        --highlight-color: #{$grey-9};
    }

    position: absolute;
    top: var(--top-bar-height);
    left: 0;
    right: 0;
    height: 52px;

    background: var(--background-color);
    border-bottom: 1px solid var(--border-color);
    transition: 0.3s ease transform;
    z-index: -1;

    @media screen and (min-width: $breakpoint-lg-min) {
        padding: 0;
    }

    &--hidden:not(:focus-within) {
        transform: translateY(-100%);
    }

    &__logo-container {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--text-color);
    }

    &__logo-image-container {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    &__logo-text {
        font-weight: 700;
        font-size: 1.3rem;
    }

    &__inner-container {
        max-width: 1200px;
        height: 100%;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    &__right-container {
        height: 100%;
        display: flex;
        align-items: center;
    }

    &__menu-button {
        @media screen and (min-width: $breakpoint-md-min) {
            display: none;
        }
    }

    &__menu-ul {
        display: none;
        height: 100%;
        list-style: none;
        flex-direction: row;
        margin: 0;
        padding: 0;

        &--visible-mobile {
            position: absolute;
            display: flex;
            left: 0;
            right: 0;
            flex-direction: column;
            top: 52px;
            height: max-content;
            background-color: var(--background-color);

            #{$this}__menu-li--expandable {
                justify-content: space-between;
            }

            #{$this}__menu-li--expanded-mobile {
                #{$this}__submenu-ul {
                    display: block;
                    width: 100%;
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    padding: 12px;
                }
            }
        }

        @media screen and (min-width: $breakpoint-md-min) {
            display: flex;
        }
    }

    &__menu-li {
        padding: 8px 16px;
        display: flex;
        align-items: center;
        user-select: none;
        cursor: pointer;
        font-weight: 500;

        &:not(&--expandable):hover {
            color: $primary;
        }

        @media screen and (min-width: $breakpoint-md-min) {
            padding: 8px;
        }

        &--expandable {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;

            @media screen and (min-width: $breakpoint-md-min) {
                position: relative;
                cursor: default;
                gap: 4px;
                align-items: center;
                flex-direction: row;

                &:hover,
                &:focus,
                &:focus-within {
                    .c-header-bottom-bar__submenu-ul {
                        opacity: 1;
                        visibility: visible;
                        transform: translateY(0);
                    }
                }
            }
        }

        &--current {
            color: $primary;
        }
    }

    &__menu-li-text {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;

        @media screen and (min-width: $breakpoint-md-min) {
            gap: 8px;
        }
    }

    &__submenu-ul {
        transition: 0.2s ease all;

        display: none;
        z-index: 999;
        list-style: none;
        color: var(--text-color);
        font-weight: normal;

        @media screen and (min-width: $breakpoint-md-min) {
            display: block;
            opacity: 0;
            padding: 12px;
            visibility: hidden;
            transform: translateY(8px);
            position: absolute;
            top: calc(100% - 1px);
            left: 0;
            justify-content: space-between;
            border-radius: 0 0 4px 4px;
            background-color: var(--background-color);
            border-top: 2px solid $primary;
        }
    }

    &__submenu-li {
        padding: 8px;
        cursor: pointer;
        user-select: none;
        transition: 0.2s ease all;
        border-radius: 8px;
        min-width: max-content;

        &:hover,
        &:active {
            background-color: var(--highlight-color);
        }

        &--current {
            color: $primary;
        }
    }
}
</style>
