<script setup lang="ts">
import SocialLinks from 'src/components/SocialLinks.vue';
import { computed, ref, watch } from 'vue';
import { useChainStore } from 'src/core';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { FooterLinksConfig } from 'src/core/types';

const $q = useQuasar();
const { t: $t } = useI18n();
const $route = useRoute();

const toTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
};

const useChain = useChainStore();
const columnsConfig = ref<FooterLinksConfig>(useChain.currentChain.settings.getFooterLinks());

// Function to update the configuration when the selected blockchain changes
function updateColumnsConfig() {
    columnsConfig.value = useChain.currentChain.settings.getFooterLinks();
}

// Watch for changes in the chain configuration
watch(() => $route.query.network, () => {
    updateColumnsConfig();
});

const logo = computed(() => $q.dark.isActive ? columnsConfig.value.branding.logoDark : columnsConfig.value.branding.logoLight);
</script>

<template>
<div class="c-footer">
    <div class="c-footer__background c-footer__background--colors"></div>
    <div class="c-footer__background c-footer__background--alpha"></div>
    <div class="c-footer__outer-container">
        <div class="c-footer__inner-container">
            <div class="c-footer__header">
                <SocialLinks />
                <a class="c-footer__back-to-top" @click="toTop">
                    <q-icon name="fas fa-arrow-up" size="12px" /> {{ $t('components.footer.back_to_top') }}
                </a>
                <a :href="columnsConfig.branding.url" class="c-footer__brand">
                    <img
                        :src="logo"
                        :alt="columnsConfig.branding.title + ' Logo'"
                        :class="{
                            'c-footer__brand-logo': true,
                            'c-footer__brand-logo--dark': $q.dark.isActive,
                            'c-footer__brand-logo--light': !$q.dark.isActive,
                        }"
                    >
                </a>
            </div>
            <div class="c-footer__columns">
                <!-- Generar columnas dinámicamente -->
                <div
                    v-for="(column, columnIndex) in columnsConfig.columns"
                    :key="`footer-column-${columnIndex}`"
                    :class="`c-footer__column c-footer__column--${String.fromCharCode(97 + columnIndex)}`"
                >
                    <div class="c-footer__column-title">{{ $t(column.title) }}</div>
                    <div class="c-footer__column-items">
                        <a
                            v-for="(link, linkIndex) in column.links"
                            :key="`footer-column-${columnIndex}-link-${linkIndex}`"
                            class="c-footer__column-item"
                            :href="link.url"
                            target="_blank"
                        >
                            {{ $t(link.label) }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>
<style lang="scss">
.c-footer {
    z-index: 2;
    width: 100%;
    color: var(--text-color);
    flex-direction: column;
    align-items: center;
    display: flex;
    position: relative;
    overflow: hidden;

    &__background {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        z-index: -1;

        &--colors {
            background-image:
                radial-gradient(circle at 0% 0%, var(--q-primary), transparent 29%);
        }

        &--alpha {
            background-color: rgba(#ffffff, 0.5);

            body.body--dark & {
                background-color: rgba(#1d1d1d, 0.5);
            }
        }
    }

    &__header {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        justify-content: space-between;
        padding-bottom: 10px;
        margin-bottom: 20px;
        border-bottom: 2px solid var(--border-color);
    }

    &__back-to-top {
        cursor: pointer;
        color: var(--grey-text-color);
        display: flex;
        flex-flow: row;
        gap: 7px;
        align-items: center;
        @media screen and (max-width: 500px) {
            display: none;
        }
    }

    &__brand {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        width: 200px;
        margin-bottom: 12px;
        &-logo {
            width: 100%;
            max-width: 6rem;
            padding-left: 0;

            body.body--dark &--light {
                display: none;
            }

            body.body--light &--dark {
                display: none;
            }
        }
    }

    &__outer-container {
        flex: 1;
        width: 100%;
        max-width: 1200px;
        flex-flow: row;
        justify-content: center;
        align-items: stretch;
        display: flex;
        @media screen and (max-width: 1240px) {
            padding-left: 10px;
            padding-right: 10px;
        }
    }

    &__inner-container {
        display: flex;
        flex-direction: column;
        margin: 20px;
        margin-right: auto !important;
        margin-left: auto !important;
        width: 100%;
        max-width: 85rem;
    }

    &__columns {
        width: 100%;
        justify-content: space-between;
        align-items: flex-start;
        display: flex;

        @media screen and (max-width: 500px) {
            grid-column-gap: 2rem;
            grid-template-rows: auto;
            grid-auto-columns: 1fr;
            grid-row-gap: 2.5rem;
            grid-template:
                'a b'
                'a c';
            display: grid;
        }
    }

    &__column {
        flex-direction: column;
        align-items: flex-start;
        justify-items: flex-start;
        display: flex;

        &--a {
            grid-area: a;
        }

        &--b {
            grid-area: b;
        }

        &--c {
            grid-area: c;
        }
    }

    &__column-title {
        text-transform: uppercase;
        margin-bottom: 0.5rem;
        font-size: 1rem;
        font-weight: bold;
    }

    &__column-items {
        flex-direction: column;
        grid-template-rows: auto;
        grid-template-columns: 100%;
        grid-auto-columns: 100%;
        align-items: flex-start;
        justify-items: flex-start;
        display: flex;
    }

    &__column-item {
        color: var(--grey-text-color);
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        font-size: .875rem;
        text-decoration: none;
        &:hover {
            color: var(--q-primary) !important;
        }
    }
}
</style>

