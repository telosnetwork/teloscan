<script setup lang="ts">

import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();
console.log('$t', $t);
</script>

<template>
<div class="c-footer">
    <div class="c-footer__background c-footer__background--colors"></div>
    <div class="c-footer__background c-footer__background--alpha"></div>
    <div class="c-footer__outer-container">
        <div class="c-footer__inner-container">
            <a class="c-footer__header">
                <img :src="require('src/assets/telos-new-logo.png')" alt="Telos Logo" class="c-footer__header-logo c-footer__header-logo--light">
                <img :src="require('src/assets/telos-new-logo--dark.png')" alt="Telos Logo" class="c-footer__header-logo c-footer__header-logo--dark">
            </a>
            <div class="c-footer__columns">
                <div class="c-footer__column c-footer__column--a">
                    <div class="c-footer__column-title">{{$t('components.footer.telos')}}</div>
                    <div class="c-footer__column-items">
                        <a class="c-footer__column-item" href="https://www.telos.net/">{{$t('components.footer.telosHomepage')}}</a>
                        <a class="c-footer__column-item" href="https://wallet.telos.net/">{{$t('components.footer.telosWallet')}}</a>
                        <a class="c-footer__column-item" href="https://bridge.telos.net/bridge">{{$t('components.footer.telosBridge')}}</a>
                        <a class="c-footer__column-item" href="https://explorer.telos.net/network">{{$t('components.footer.telosZeroExplorer')}}</a>
                        <a class="c-footer__column-item" href="https://www.telos.net/buy">{{$t('components.footer.buyTelos')}}</a>
                        <a class="c-footer__column-item" href="https://docs.telos.net/users/knowledge-base/how-to-stake-tlos/">{{$t('components.footer.stakeTelos')}}</a>
                        <a class="c-footer__column-item" href="https://www.telos.net/ecosystem">{{$t('components.footer.telosEcosystem')}}</a>
                        <a class="c-footer__column-item" href="https://www.teloscan.io/health">{{$t('components.footer.networkStatus')}}</a>
                    </div>
                </div>
                <div class="c-footer__column c-footer__column--b">
                    <div class="c-footer__column-title">{{$t('components.footer.about')}}</div>
                    <div class="c-footer__column-items">
                        <a class="c-footer__column-item" href="https://www.telos.net/about">{{$t('components.footer.aboutUs')}}</a>
                        <a class="c-footer__column-item" href="http://t.me/HelloTelos">{{$t('components.footer.contactUs')}}</a>
                    </div>
                </div>
                <div class="c-footer__column c-footer__column--c">
                    <div class="c-footer__column-title">{{$t('components.footer.build')}}</div>
                    <div class="c-footer__column-items">
                        <a class="c-footer__column-item" href="http://api.teloscan.io/swagger/">{{$t('components.footer.apiDocumentation')}}</a>
                        <a class="c-footer__column-item" href="https://docs.telos.net/overview/what-is-telos/introduction/">{{$t('components.footer.telosDocumentation')}}</a>
                        <a class="c-footer__column-item" href="https://github.com/telosnetwork">{{$t('components.footer.github')}}</a>
                        <a class="c-footer__column-item" href="https://www.telos.net/community-resources">{{$t('components.footer.brandAssets')}}</a>
                    </div>
                </div>
            </div>
            <div class="c-footer__social-links">
                <a class="c-footer__social-link" href="http://t.me/HelloTelos">
                    <q-img
                        :src="require('src/assets/icon-social--telegram.svg')"
                        height="24px"
                        width="24px"
                    />
                    <q-tooltip anchor="top middle" self="bottom middle">
                        Telegram
                    </q-tooltip>
                </a>
                <a class="c-footer__social-link" href="https://twitter.com/HelloTelos">
                    <q-img
                        :src="require('src/assets/icon-social--x-twitter.svg')"
                        height="24px"
                        width="24px"
                    />
                    <q-tooltip anchor="top middle" self="bottom middle">
                        X (Twitter)
                    </q-tooltip>
                </a>
                <a class="c-footer__social-link" href="https://www.youtube.com/@TheTelosNetwork">
                    <q-img
                        :src="require('src/assets/icon-social--youtube.svg')"
                        height="24px"
                        width="24px"
                    />
                    <q-tooltip anchor="top middle" self="bottom middle">
                        YouTube
                    </q-tooltip>
                </a>
                <a class="c-footer__social-link" href="https://discord.gg/telos">
                    <q-img
                        :src="require('src/assets/icon-social--discord.svg')"
                        height="24px"
                        width="24px"
                    />
                    <q-tooltip anchor="top middle" self="bottom middle">
                        Discord
                    </q-tooltip>
                </a>
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
                radial-gradient(circle at 0% 0%, $primary, transparent 29%);
        }

        &--alpha {
            background-color: rgba(#ffffff, 0.5);

            body.body--dark & {
                background-color: rgba(#1d1d1d, 0.5);
            }
        }
    }

    &__header {
        padding-bottom: 20px;
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
        padding-left: 1.25rem;
        padding-right: 1.25rem;
        display: flex;
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

    &__social-links {
        margin-top: 1rem;
        flex-direction: row;
        justify-content: flex-end;
        display: flex;
        @media screen and (max-width: 1300px) {
            margin-right: 20px;
        }
    }

    &__social-link {
        display: inline-block;
        margin-right: 1rem;
        img {
            width: 1.5rem;
            height: 1.5rem;
        }
    }
}
</style>

