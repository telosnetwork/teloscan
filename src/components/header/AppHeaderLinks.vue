<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import {
    IS_MAINNET,
    IS_TESTNET,
    // TELOSCAN_MAINNET_URL,
    // TELOSCAN_TESTNET_URL,
    BETA_TELOSCAN_MAINNET_URL,
    BETA_TELOSCAN_TESTNET_URL,
} from 'src/lib/chain-utils';

import LanguageSwitcherModal from 'components/header/LanguageSwitcherModal.vue';
import OutlineButton from 'components/OutlineButton.vue';

const $route = useRoute();
const $router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();

defineProps<{
    menuVisibleMobile: boolean;
}>();
const emit = defineEmits(['close-menu']);


const blockchainSubmenuItems = [
    { name: 'transactions', label: $t('components.header.transactions') },
    { name: 'blocks', label: $t('components.header.blocks') },
];

const teloscanSwaggerUrl = IS_MAINNET
    ? 'https://api.teloscan.io/v1/docs'
    : 'https://api.testnet.teloscan.io/v1/docs';

const developersSubmenuItems = [
    {
        url: teloscanSwaggerUrl,
        label: $t('components.header.api_documentation'),
    },
    {
        url: 'https://sourcify.dev/',
        label: $t('components.header.verify_contract_sourcify'),
    },
];

const telos_walletMenuItem = {
    url: 'https://wallet.telos.net/',
    label: $t('components.header.telos_wallet'),
};


const telos_bridgeMenuItem = {
    url: 'https://bridge.telos.net/bridge',
    label: $t('components.header.telos_bridge'),
};

const moreSubmenuItems = {
    internal: [
        // { name: 'export', label: $t('components.header.csv_export') },
        { name: 'health', label: $t('components.header.health_monitor') },
    ],
    external: [
        {
            url: 'https://www.telos.net/ecosystem',
            label: $t('components.header.telos_ecosystem'),
        },
    ],
};

const networksMenuItems = {
    mainnet: [{
        url: BETA_TELOSCAN_MAINNET_URL,
        label: 'Telos Mainnet',
    }],
    testnet: [{
        url: BETA_TELOSCAN_TESTNET_URL,
        label: 'Telos Testnet',
    }],
};

const blockchainMenuExpandedMobile = ref(false);
const developersMenuExpandedMobile = ref(false);
const moreMenuExpandedMobile = ref(false);
const networkMenuExpandedMobile = ref(false);
const showLanguageSwitcher = ref(false);

const highlightBlockchainMenuItem = computed(() => blockchainSubmenuItems.some(({ name }) => name === $route.name));
const highlightMoreMenuItem = computed(() => moreSubmenuItems.internal.some(({ name }) => name === $route.name));

watch(() => $q.screen, () => {
    closeAllMenus();
}, { deep: true });

function blurActiveElement() {
    (document.activeElement as HTMLElement | null)?.blur();
}

function closeAllMenus() {
    emit('close-menu');
    blockchainMenuExpandedMobile.value = false;
    developersMenuExpandedMobile.value = false;
    moreMenuExpandedMobile.value = false;
    networkMenuExpandedMobile.value = false;
}

function toggleDarkMode() {
    $q.dark.toggle();
    localStorage.setItem('darkModeEnabled', $q.dark.isActive.toString());
}

function getIsCurrentNetworkMenuItem(url: string) {
    if (url === BETA_TELOSCAN_MAINNET_URL) {
        return IS_MAINNET;
    }

    if (url === BETA_TELOSCAN_TESTNET_URL) {
        return IS_TESTNET;
    }

    return false;
}

function goTo(to: string | { name: string }) {
    blurActiveElement();
    closeAllMenus();

    const httpsRegex = /^https/;
    if (typeof to === 'string' && httpsRegex.test(to)) {
        window.open(to, '_blank');
        return;
    }

    $router.push(to);
}
</script>

<template>
<ul
    :class="{
        'c-header-links': true,
        'c-header-links--visible-mobile shadow-4': menuVisibleMobile && $q.screen.lt.md,
    }"
>
    <!-- Home -->
    <router-link
        :class="{
            'c-header-links__menu-li': true,
            'c-header-links__menu-li--current': $route.name === 'home',
        }"
        tabindex="0"
        role="link"
        :to="{ name: 'home' }"
        @click="closeAllMenus"
        @keydown.enter="goTo({ name: 'home' })"
    >
        {{ $t('components.header.home') }}
    </router-link>

    <!-- Blockchain -->
    <li
        :class="{
            'c-header-links__menu-li c-header-links__menu-li--expandable': true,
            'c-header-links__menu-li--current': highlightBlockchainMenuItem,
            'c-header-links__menu-li--expanded-mobile': blockchainMenuExpandedMobile,
        }"
        tabindex="0"
        :aria-expanded="$q.screen.lt.md ? blockchainMenuExpandedMobile : undefined"
        :aria-controls="$q.screen.lt.md ? 'app-header-blockchain-submenu-ul' : undefined"
        :aria-labelledby="$q.screen.lt.md ? 'app-header-blockchain-submenu-label' : undefined"
        @mouseleave="blurActiveElement"
        @click="blockchainMenuExpandedMobile = !blockchainMenuExpandedMobile"
        @keydown.enter="blockchainMenuExpandedMobile = !blockchainMenuExpandedMobile"
    >
        <div id="app-header-blockchain-submenu-label" class="c-header-links__menu-li-text">
            {{ $t('components.header.blockchain') }}
            <q-icon name="fas fa-chevron-down" size="12px" />
        </div>

        <ul
            id="app-header-blockchain-submenu-ul"
            :class="{
                'c-header-links__submenu-ul': true,
                'shadow-4': $q.screen.gt.sm,
            }"
        >
            <router-link
                v-for="item in blockchainSubmenuItems"
                :key="`blockchain-submenu-item-${item.name}`"
                :class="{
                    'c-header-links__submenu-li': true,
                    'c-header-links__submenu-li--current': $route.name === item.name,
                }"
                tabindex="0"
                role="link"
                :to="{ name: item.name }"
                @click="closeAllMenus"
                @keydown.enter="goTo({ name: item.name })"
            >
                {{ item.label }}
            </router-link>
        </ul>
    </li>

    <!-- Developers -->
    <li
        :class="{
            'c-header-links__menu-li c-header-links__menu-li--expandable': true,
            'c-header-links__menu-li--expanded-mobile': developersMenuExpandedMobile,
        }"
        tabindex="0"
        :aria-expanded="$q.screen.lt.md ? developersMenuExpandedMobile : undefined"
        :aria-controls="$q.screen.lt.md ? 'app-header-developers-submenu-ul' : undefined"
        :aria-labelledby="$q.screen.lt.md ? 'app-header-developers-submenu-label' : undefined"
        @mouseleave="blurActiveElement"
        @click="developersMenuExpandedMobile = !developersMenuExpandedMobile"
        @keydown.enter="developersMenuExpandedMobile = !developersMenuExpandedMobile"
    >
        <div id="app-header-developers-submenu-label" class="c-header-links__menu-li-text">
            {{ $t('components.header.developers') }}
            <q-icon name="fas fa-chevron-down" size="12px" />
        </div>

        <ul
            id="app-header-developers-submenu-ul"
            :class="{
                'c-header-links__submenu-ul': true,
                'shadow-4': $q.screen.gt.sm,
            }"
        >
            <li
                v-for="item in developersSubmenuItems"
                :key="`developer-submenu-item-${item.label}`"
                class="c-header-links__submenu-li"
                tabindex="0"
                role="link"
                @keydown.enter="goTo(item.url)"
            >
                <a
                    class="u-flex--center-y"
                    :href="item.url"
                    target="_blank"
                >
                    {{ item.label }}
                    <q-icon name="fas fa-external-link-alt" size="12px" class="q-ml-sm" />
                </a>
            </li>
        </ul>
    </li>

    <!-- Telos Wallet -->
    <li
        class="c-header-links__menu-li"
        tabindex="0"
        role="link"
        @keydown.enter="goTo(telos_walletMenuItem.url)"
    >
        <a :href="telos_walletMenuItem.url" target="_blank">
            {{ telos_walletMenuItem.label }}
        </a>
    </li>

    <!-- Telos Bridge -->
    <li
        class="c-header-links__menu-li"
        tabindex="0"
        role="link"
        @keydown.enter="goTo(telos_bridgeMenuItem.url)"
    >
        <a :href="telos_bridgeMenuItem.url" target="_blank">
            {{ telos_bridgeMenuItem.label }}
        </a>
    </li>

    <!-- More -->
    <li
        :class="{
            'c-header-links__menu-li c-header-links__menu-li--expandable': true,
            'c-header-links__menu-li--current': highlightMoreMenuItem,
            'c-header-links__menu-li--expanded-mobile': moreMenuExpandedMobile,
        }"
        tabindex="0"
        :aria-expanded="$q.screen.lt.md ? moreMenuExpandedMobile : undefined"
        :aria-controls="$q.screen.lt.md ? 'app-header-more-submenu-ul' : undefined"
        :aria-labelledby="$q.screen.lt.md ? 'app-header-more-submenu-label' : undefined"
        @mouseleave="blurActiveElement"
        @click="moreMenuExpandedMobile = !moreMenuExpandedMobile"
        @keydown.enter="moreMenuExpandedMobile = !moreMenuExpandedMobile"
    >
        <div id="app-header-more-submenu-label" class="c-header-links__menu-li-text">
            {{ $t('components.header.more') }}
            <q-icon name="fas fa-chevron-down" size="12px" />
        </div>

        <ul
            id="app-header-more-submenu-ul"
            :class="{
                'c-header-links__submenu-ul c-header-links__submenu-ul--rightmost': true,
                'shadow-4': $q.screen.gt.sm,
            }"
        >
            <li
                class="c-header-links__submenu-li"
                tabindex="0"
                role="button"
                :aria-label="$t('components.header.open_language_switcher')"
                @keydown.enter="showLanguageSwitcher = true"
                @click="showLanguageSwitcher = true"
            >
                <div class="u-flex--center-y">
                    {{ $t('global.language') }}
                    <q-icon name="fas fa-language" size="16px" class="q-ml-sm" />
                </div>
            </li>

            <router-link
                v-for="item in moreSubmenuItems.internal"
                :key="`more-submenu-item-internal-${item.name}`"
                :class="{
                    'c-header-links__submenu-li': true,
                    'c-header-links__submenu-li--current': $route.name === item.name,
                }"
                tabindex="0"
                :to="{ name: item.name }"
                @keydown.enter="goTo({ name: item.name })"
            >
                {{ item.label }}
            </router-link>

            <li
                v-for="item in moreSubmenuItems.external"
                :key="`more-submenu-item-external-${item.label}`"
                class="c-header-links__submenu-li"
                tabindex="0"
                role="link"
                @click="goTo(item.url)"
                @keydown.enter="goTo(item.url)"
            >
                <a
                    class="u-flex--center-y"
                    :href="item.url"
                    target="_blank"
                >
                    {{ item.label }}
                    <q-icon name="fas fa-external-link-alt" size="12px" class="q-ml-sm" />
                </a>
            </li>
        </ul>
    </li>

    <!-- Networks -->
    <li
        v-if="$q.screen.lt.md"
        :class="{
            'c-header-links__menu-li c-header-links__menu-li--expandable': true,
            'c-header-links__menu-li--expanded-mobile': networkMenuExpandedMobile,
        }"
        tabindex="0"
        :aria-expanded="$q.screen.lt.md ? networkMenuExpandedMobile : undefined"
        :aria-controls="$q.screen.lt.md ? 'app-header-network-submenu-ul' : undefined"
        :aria-labelledby="$q.screen.lt.md ? 'app-header-network-submenu-label' : undefined"
        @mouseleave="blurActiveElement"
        @click="networkMenuExpandedMobile = !networkMenuExpandedMobile"
        @keydown.enter="networkMenuExpandedMobile = !networkMenuExpandedMobile"
    >
        <div id="app-header-network-submenu-label" class="c-header-links__menu-li-text">
            {{ $t('components.header.network') }}
            <q-icon name="fas fa-chevron-down" size="12px" />
        </div>

        <ul
            id="app-header-network-submenu-ul"
            :class="{
                'c-header-links__submenu-ul': true,
                'shadow-4': $q.screen.gt.sm,
            }"
        >
            <li
                v-for="item in networksMenuItems.mainnet"
                :key="`networks-submenu-item-mainnet-${item.label}`"
                :class="{
                    'c-header-links__submenu-li': true,
                    'c-header-links__submenu-li--current': getIsCurrentNetworkMenuItem(item.url),
                }"
                tabindex="0"
                role="link"
                @click="goTo(item.url)"
                @keydown.enter="goTo(item.url)"
            >
                {{ item.label }}
            </li>

            <q-separator />

            <li
                v-for="item in networksMenuItems.testnet"
                :key="`networks-submenu-item-testnet-${item.label}`"
                :class="{
                    'c-header-links__submenu-li': true,
                    'c-header-links__submenu-li--current': getIsCurrentNetworkMenuItem(item.url),
                }"
                tabindex="0"
                role="link"
                @click="goTo(item.url)"
                @keydown.enter="goTo(item.url)"
            >
                {{ item.label }}
            </li>
        </ul>
    </li>

    <!-- Theme Toggle -->
    <li v-if="$q.screen.lt.md" class="c-header-links__menu-li">
        <OutlineButton
            text-color="default"
            class="c-header-links__theme-toggle"
            @click="toggleDarkMode"
        >
            <q-icon
                v-if="$q.dark.isActive"
                name="light_mode"
                size="16px"
                color="primary"
                class="q-mr-sm"
            />
            <q-icon
                v-else
                name="far fa-moon"
                size="14px"
                color="primary"
                class="q-mr-sm"
            />
            {{ $t(`components.header.switch_to_${$q.dark.isActive ? 'light' : 'dark'}_theme`) }}
        </OutlineButton>
    </li>
</ul>

<LanguageSwitcherModal :show="showLanguageSwitcher" @hide="showLanguageSwitcher = false" />
</template>

<style lang="scss">
.c-header-links {
    $this: &;

    // other CSS vars defined in AppHeader.vue
    --highlight-color: #{$grey-3};

    @at-root .body--dark & {
        --highlight-color: #{$grey-9};
    }

    display: none;
    height: 100%;
    list-style: none;
    flex-direction: row;
    margin: 0;
    padding: 0;

    @media screen and (min-width: $breakpoint-md-min) {
        display: flex;
    }

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

    &__menu-li {
        color: var(--text-color);
        padding: 8px 16px;
        display: flex;
        align-items: center;
        user-select: none;
        cursor: pointer;
        font-weight: 500;

        &:not(&--expandable):hover {
            color: var(--q-primary);
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
                    #{$this}__submenu-ul {
                        opacity: 1;
                        visibility: visible;
                        transform: translateY(0);
                    }
                }
            }
        }

        &--current {
            color: var(--q-primary);
        }

        & a:not(#{$this}__submenu-li--current) {
            color: inherit;
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
            border-top: 2px solid var(--q-primary);

            &--rightmost {
                right: 0;
                left: unset;
            }
        }
    }

    &__submenu-li {
        padding: 8px;
        cursor: pointer;
        user-select: none;
        transition: 0.2s ease all;
        border-radius: 8px;
        min-width: max-content;

        display: list-item;
        text-align: -webkit-match-parent;
        color: var(--text-color);

        &:hover,
        &:active {
            color: var(--text-color);
            background-color: var(--highlight-color);
        }

        &--current {
            color: var(--q-primary);
        }

        & a {
            color: inherit;
        }
    }

    &__theme-toggle {
        width: 100%;
    }
}
</style>
