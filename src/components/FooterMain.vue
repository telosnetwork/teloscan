<script setup lang="ts">
import SocialLinks from 'components/SocialLinks';
import { useI18n } from 'vue-i18n';
const { t: $t } = useI18n();

const toTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
};


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
                    <q-icon name="fas fa-arrow-up" size="12px" /> {{$t('components.footer.back_to_top')}}
                </a>
                <a class="c-footer__brand">
                    <img :src="require('src/assets/telos-new-logo.png')" alt="Telos Logo" class="c-footer__brand-logo c-footer__brand-logo--light">
                    <img :src="require('src/assets/telos-new-logo--dark.png')" alt="Telos Logo" class="c-footer__brand-logo c-footer__brand-logo--dark">
                </a>
            </div>
            <div class="c-footer__columns">
                <div class="c-footer__column c-footer__column--a">
                    <div class="c-footer__column-title">{{$t('components.footer.telos')}}</div>
                    <div class="c-footer__column-items">
                        <a class="c-footer__column-item" href="https://www.telos.net/">{{$t('components.footer.telos_homepage')}}</a>
                        <a class="c-footer__column-item" href="https://wallet.telos.net/">{{$t('components.footer.telos_wallet')}}</a>
                        <a class="c-footer__column-item" href="https://bridge.telos.net/bridge">{{$t('components.footer.telos_bridge')}}</a>
                        <a class="c-footer__column-item" href="https://explorer.telos.net/network">{{$t('components.footer.telos_zero_explorer')}}</a>
                        <a class="c-footer__column-item" href="https://www.telos.net/buy">{{$t('components.footer.buy_telos')}}</a>
                        <a class="c-footer__column-item" href="https://docs.telos.net/users/knowledge-base/how-to-stake-tlos/">{{$t('components.footer.stake_telos')}}</a>
                        <a class="c-footer__column-item" href="https://www.telos.net/ecosystem">{{$t('components.footer.telos_ecosystem')}}</a>
                        <a class="c-footer__column-item" href="https://www.teloscan.io/health">{{$t('components.footer.network_status')}}</a>
                    </div>
                </div>
                <div class="c-footer__column c-footer__column--b">
                    <div class="c-footer__column-title">{{$t('components.footer.about')}}</div>
                    <div class="c-footer__column-items">
                        <a class="c-footer__column-item" href="https://www.telos.net/about">{{$t('components.footer.about_us')}}</a>
                        <a class="c-footer__column-item" href="http://t.me/HelloTelos">{{$t('components.footer.contactUs')}}</a>
                    </div>
                </div>
                <div class="c-footer__column c-footer__column--c">
                    <div class="c-footer__column-title">{{$t('components.footer.build')}}</div>
                    <div class="c-footer__column-items">
                        <a class="c-footer__column-item" href="https://api.teloscan.io/v1/docs">{{$t('components.footer.api_documentation')}}</a>
                        <a class="c-footer__column-item" href="https://docs.telos.net/overview/what-is-telos/introduction/">{{$t('components.footer.telos_documentation')}}</a>
                        <a class="c-footer__column-item" href="https://github.com/telosnetwork">{{$t('components.footer.github')}}</a>
                        <a class="c-footer__column-item" href="https://www.telos.net/community-resources">{{$t('components.footer.brand_assets')}}</a>
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

