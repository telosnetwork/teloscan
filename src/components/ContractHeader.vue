<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// const { t: $t } = useI18n();

defineProps({
    contract: {
        type: Object,
        required: true,
    },
    metaData: {
        type: Object,
        required: false,
    },
});

</script>

<template>
<div class="c-contract-header">
    <!--
        <q-card class="c-contract-header c-contract-header__title">
            <q-card-section v-if="contract.isVerified()" class="c-contract-header__section c-contract-header__section--bold">
                <q-icon
                    class="fas fa-check-circle text-positive c-contract-header__icon"
                    size=".75rem"
                >
                    <q-tooltip>
                        {{ $t('components.contract_tab.verified_contract') }}
                    </q-tooltip>
                </q-icon>
                Contract Source Code Verified
            </q-card-section>
            <q-card-section v-else class="c-contract-header__section">
                <q-icon
                    class="cursor text-warning c-contract-header__icon"
                    name="warning"
                    size=".75rem"
                >
                    <q-tooltip>
                        {{ $t('components.contract_tab.unverified_contract') }}
                    </q-tooltip>
                </q-icon>
                Unverified Contract. Verify and Publish with
                <a href="https://sourcify.dev/#/verifier">
                    Sourcify
                </a>.
            </q-card-section>
        </q-card>
        <q-card class="c-contract-header">
            <q-card-section class="c-contract-header__section">
                Contract Name:
                <div class="c-contract-header__section--bold c-contract-header__section--inline">
                    {{ contract.getName() }}
                </div>
            </q-card-section>
            <q-card-section class="c-contract-header__section">
                Compiler Version:
                <div class="c-contract-header__section--bold c-contract-header__section--inline">
                    {{ metaData?.compiler }}
                </div>
            </q-card-section>
        </q-card>
        <q-card class="c-contract-header">
            <q-card-section class="c-contract-header__section">
                Optimization Enabled:
                <div class="c-contract-header__section--bold c-contract-header__section--inline">
                    {{ metaData?.enabled }}
                    <span class="c-contract-header__section--regular">&nbsp;with&nbsp;</span>
                    {{ metaData?.runs }}
                    <span class="c-contract-header__section--regular">&nbsp;runs</span>
                </div>
            </q-card-section>
        </q-card>

        <div>
            <div class="c-contract-header__section">
                <q-icon name="far fa-file-code" size=".75rem" class="c-contract-header__icon" />
                Contract Source Code
            </div>
        </div>
    -->
    <div class="c-contract-header__title">
        <q-icon
            class="fas fa-check-circle text-positive c-contract-header__icon"
            size=".75rem"
        >
            <q-tooltip>
                {{ $t('components.contract_tab.verified_contract') }}
            </q-tooltip>
        </q-icon>
        Contract Source Code Verified
    </div>

    <div class="c-contract-header__data">
        <div class="c-contract-header__data-col">
            <div class="c-contract-header__data-col-row">
                <div class="c-contract-header__data-title">Contract Name:</div>
                <div class="c-contract-header__data-value">{{ contract.getName() }}</div>
            </div>
            <hr class="c-contract-header__data-divider" >
            <div class="c-contract-header__data-col-row">
                <div class="c-contract-header__data-title">Compiler Version:</div>
                <div class="c-contract-header__data-value">{{ metaData?.compiler }}</div>
            </div>
            <hr class="c-contract-header__data-divider c-contract-header__data-divider--mobile" >
        </div>
        <div class="c-contract-header__data-col">
            <div class="c-contract-header__data-col-row">
                <div class="c-contract-header__data-title">Optimization Enabled:</div>
                <div class="c-contract-header__data-value">
                    <b>{{ metaData?.enabled }}</b>&nbsp;
                    <span>with</span>&nbsp;
                    <b>{{ metaData?.runs }}</b>&nbsp;
                    <span>runs</span>&nbsp;
                </div>
            </div>
            <hr class="c-contract-header__data-divider" >
        </div>
    </div>
    <div class="c-contract-header__source-title">
        <q-icon name="far fa-file-code" size=".75rem" class="c-contract-header__icon" />
        Contract Source Code
    </div>


</div>
</template>

<style lang="scss">
.c-contract-header {
    height:100%;
    width: 100%;

    $padding-top: 25px;

    &__title {
        display: flex;
        align-items: center;
        padding-top: $padding-top;
        gap: 5px;
        font-weight: bold;
    }

    &__data {
        padding-top: $padding-top;
        &-col {
            width: 100%;
            display: inline-flex;
            flex-direction: column;
            @media only screen and (min-width: $breakpoint-md-min) {
                width: 50%;
            }

            &-row {
                padding: 10px 0px;
                display: flex;
                flex-direction: row;
                justify-content: flex-start;
                align-items: flex-start;
            }
        }
        &-title {
            font-weight: bold;
            width: 30%;
            min-width: 170px;
            white-space: nowrap;
        }
        &-value {
            font-weight: normal;
            word-break: break-word;
        }
        &-divider {
            width: 100%;
            @media only screen and (min-width: $breakpoint-md-min) {
                &--mobile {
                    display: none;
                }
            }
        }
    }

    &__source-title {
        display: flex;
        align-items: center;
        padding-top: $padding-top;
        gap: 5px;
        font-weight: bold;
    }
}
</style>
