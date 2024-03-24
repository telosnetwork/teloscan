<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

import AddressField from 'components/AddressField.vue';
import CopyButton from 'components/CopyButton.vue';
import TransactionField from 'components/TransactionField.vue';

const { t: $t } = useI18n();

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
    transaction: {
        type: String,
        required: true,
    },
    loadingComplete: {
        type: Boolean,
        required: true,
    },
});

</script>

<template>
<q-card class="c-more-info">
    <q-card-section class="c-more-info__header">
        {{ $t('pages.more_info') }}
    </q-card-section>
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else class="c-more-info__section">
        <div>
            {{ $t('pages.contract_creator') }}
        </div>
        <AddressField
            :address="props.address"
            :truncate="18"
            class="c-more-info__value"
        />
        <CopyButton
            :text="props.address"
            accompanyingText=""
            description="creator address"
            class="c-more-info__copy"
        />
        <div class="c-more-info__at-txn c-more-info__value">at txn</div>
        <TransactionField
            :transaction-hash="props.transaction"
            class="c-more-info__value"
        />
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-more-info{
    height:100%;
    text-transform: uppercase;

    .c-address-field__text{
        font-size: 18px;
    }

    &__copy{
        display: inline;
        font-size: 16px;
    }
    &__header {
        font-size: 18px;
        font-weight: 600;
    }
    &__at-txn{
        display: inline-flex;
        text-transform: lowercase;
        margin-right: .25rem;
        margin-left: .25rem;
    }
    &__skeleton {
        height: 2rem;

        @media screen and (min-width: $breakpoint-md-min) {
            width: 50%;
        }
    }
}
</style>
