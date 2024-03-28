<script lang="ts" setup>
// import { useI18n } from 'vue-i18n';

// const { t: $t } = useI18n();

defineProps({
    contract: {
        type: Object,
        required: true,
    },
});

</script>

<template>
<div>
    <q-card class="c-contract-header">
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
            Unverified Contract. Verify and Publish with <a href="https://sourcify.dev/#/verifier">Sourcify</a>.
        </q-card-section>
        <q-card-section class="c-contract-header__section">
            Contract Name: <div class="c-contract-header__section--bold c-contract-header__section--inline">{{ contract.getName() }}</div>
        </q-card-section>
        <q-card-section class="c-contract-header__section">
            <q-icon name="far fa-file-code" size=".75rem" class="c-contract-header__icon" />
            Contract Source Code
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
.c-contract-header{
    height:100%;
    box-shadow: none;
    margin-top: 12px;
    &__section {
        font-size: 18px;
        padding-left: 0;
        padding-right: 0;
        &--bold{
            font-weight: 600;
        }
        &--inline{
            display: inline-flex;
        }
    }
    &__icon{
        margin-bottom: 6px;
    }
}
</style>
