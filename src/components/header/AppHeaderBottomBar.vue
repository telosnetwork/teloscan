<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import LanguageSwitcherModal from 'components/header/LanguageSwitcherModal.vue';


const $router = useRouter();
const $route = useRoute();


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
    url: 'https://www.wallet.telos.net/',
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
            <ul class="c-header-bottom-bar__menu-ul">
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
                    }"
                    tabindex="0"
                    @mouseleave="blurActiveElement"
                >
                    Blockchain
                    <q-icon name="fas fa-chevron-down" size="12px" />

                    <ul class="c-header-bottom-bar__submenu-ul shadow-2">
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
                    class="c-header-bottom-bar__menu-li c-header-bottom-bar__menu-li--expandable"
                    tabindex="0"
                    @mouseleave="blurActiveElement"
                >
                    Developers
                    <q-icon name="fas fa-chevron-down" size="12px" />

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
                    }"
                    tabindex="0"
                    @mouseleave="blurActiveElement"
                >
                    More
                    <q-icon name="fas fa-chevron-down" size="12px" />

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
    }

    &__menu-ul {
        height: 100%;
        list-style: none;
        display: flex;
        flex-direction: row;
        margin: 0;
        padding: 0;
    }

    &__menu-li {
        padding: 8px;
        display: flex;
        align-items: center;
        user-select: none;
        cursor: pointer;
        font-weight: 500;

        &:not(&--expandable):hover {
            color: $primary;
        }

        &--expandable {
            position: relative;
            cursor: default;
            gap: 4px;

            &:hover,
            &:focus,
            &:focus-within {
                #{$this}__submenu-ul {
                    visibility: visible;
                    opacity: 1;
                    transform: translateY(0);
                }
            }
        }

        &--current {
            color: $primary;
        }
    }

    &__submenu-ul {
        visibility: hidden;
        opacity: 0;
        transform: translateY(8px);
        transition: 0.2s ease all;
        position: absolute;
        top: calc(100% - 1px);
        left: 0;
        background-color: var(--background-color);
        padding: 12px;
        border-radius: 0 0 4px 4px;
        z-index: 999;
        list-style: none;
        border-top: 2px solid $primary;
        color: var(--text-color);
        font-weight: normal;
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
