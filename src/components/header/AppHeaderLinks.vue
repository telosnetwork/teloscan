<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';

import {
    TELOSCAN_MAINNET_URL,
    TELOSCAN_TESTNET_URL,
} from 'src/lib/chain-utils';

import LanguageSwitcherModal from 'components/header/LanguageSwitcherModal.vue';
import OutlineButton from 'components/OutlineButton.vue';
import { useChainStore } from 'src/core';
import { HeaderMenuEntry } from 'src/core/types';

const $route = useRoute();
const $router = useRouter();
const $q = useQuasar();
const { t: $t } = useI18n();

defineProps<{
    menuVisibleMobile: boolean;
}>();
const emit = defineEmits(['close-menu']);

const networksMenuItems = {
    mainnet: [{
        url: TELOSCAN_MAINNET_URL,
        label: 'Telos Mainnet',
    }],
    testnet: [{
        url: TELOSCAN_TESTNET_URL,
        label: 'Telos Testnet',
    }],
};

const blockchainMenuExpandedMobile = ref(false);
const developersMenuExpandedMobile = ref(false);
const moreMenuExpandedMobile = ref(false);
const networkMenuExpandedMobile = ref(false);
const showLanguageSwitcher = ref(false);

watch(() => $q.screen, () => {
    closeAllMenus();
}, { deep: true });

const menuConfig = ref(useChainStore().currentChain.settings.getHeaderMenuConfig());

function updateMenuConfig() {
    menuConfig.value = useChainStore().currentChain.settings.getHeaderMenuConfig();
}

watch(() => $route.query.network, () => {
    updateMenuConfig();
});

const menuExpandedMobile = ref<Record<string, boolean>>({});

function handleEntryClick(entry: HeaderMenuEntry) {
    blurActiveElement();
    closeAllMenus();
    if (entry.internalLink) {
        $router.push({ name: entry.internalLink });
    } else if (entry.externalLink) {
        window.open(entry.externalLink, '_blank');
    } else if (entry.trigger) {
        trigger(entry.trigger);
    }
}

function isEntryActive(entry: HeaderMenuEntry): boolean {
    if (entry.internalLink && $route.name === entry.internalLink) {
        return true;
    }
    if (entry.entries) {
        return entry.entries.some(subEntry => isEntryActive(subEntry));
    }
    return false;
}

function trigger(action: string) {
    if (action === 'language') {
        showLanguageSwitcher.value = true;
    } else if (action === 'close-menu') {
        closeAllMenus();
    } else if (action === 'toggle-dark-mode') {
        toggleDarkMode();
    }
}

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
    networksMenuItems.mainnet.forEach((item) => {
        if (item.url === url) {
            return true;
        }
    });
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
    <!-- Iterating over the menu entries -->
    <li
        v-for="(entry, index) in menuConfig.entries"
        :key="entry.label"
        :class="{
            'c-header-links__menu-li': true,
            'c-header-links__menu-li--expandable': entry.entries,
            'c-header-links__menu-li--current': isEntryActive(entry),
            'c-header-links__menu-li--expanded-mobile': menuExpandedMobile[entry.label],
        }"
        tabindex="0"
        @mouseleave="blurActiveElement"
        @click="entry.entries ? (menuExpandedMobile[entry.label] = !menuExpandedMobile[entry.label]) : handleEntryClick(entry)"
        @keydown.enter="entry.entries ? (menuExpandedMobile[entry.label] = !menuExpandedMobile[entry.label]) : handleEntryClick(entry)"
    >
        <div class="c-header-links__menu-li-text">
            {{ $t(entry.label) }}
            <q-icon v-if="entry.entries" name="fas fa-chevron-down" size="12px" />
        </div>

        <!-- Sub menu -->
        <ul
            v-if="entry.entries"
            :class="{
                'c-header-links__submenu-ul': true,
                'shadow-4': $q.screen.gt.sm,
                'c-header-links__submenu-ul--rightmost': index === menuConfig.entries.length - 1,
            }"
        >
            <li
                v-for="subEntry in entry.entries"
                :key="subEntry.label"
                :class="{
                    'c-header-links__submenu-li': true,
                    'c-header-links__submenu-li--current': isEntryActive(subEntry),
                }"
                tabindex="0"
                @click="handleEntryClick(subEntry)"
                @keydown.enter="handleEntryClick(subEntry)"
            >
                <!-- Internal links -->
                <router-link
                    v-if="subEntry.internalLink"
                    :to="{ name: subEntry.internalLink }"
                    @click="closeAllMenus"
                >
                    {{ $t(subEntry.label) }}
                </router-link>

                <!-- External links -->
                <a
                    v-else-if="subEntry.externalLink"
                    :href="subEntry.externalLink"
                    target="_blank"
                >
                    <div class="u-flex--center-y">
                        {{ $t(subEntry.label) }}
                        <q-icon name="fas fa-external-link-alt" size="12px" class="q-ml-sm" />
                    </div>
                </a>

                <!-- Actions (triggers) -->
                <div
                    v-else-if="subEntry.trigger"
                    @click="trigger(subEntry.trigger)"
                >
                    <div class="u-flex--center-y">
                        {{ $t(subEntry.label) }}
                        <q-icon
                            v-if="subEntry.leftIcon"
                            :name="subEntry.leftIcon"
                            size="16px"
                            class="q-ml-sm"
                        />
                    </div>
                </div>

                <!-- Other cases -->
                <div v-else>
                    {{ $t(subEntry.label) }}
                </div>
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
