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
    <q-card-section v-if="!loadingComplete" >
        <q-skeleton type="text" class="c-overview__skeleton" />
    </q-card-section>
    <q-card-section v-else class="c-more-info__section">
        <div class="c-more-info__creator">
            {{ $t('pages.contract_creator') }}
        </div>
        <AddressField
            :address="props.address"
            :truncate="18"
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
        />
    </q-card-section>
</q-card>
</template>

<style lang="scss">
.c-more-info{
    height:100%;

    &__copy{
        display: inline;
        font-size: 16px;
    }
    &__creator{
        font-weight: 600;
        font-size: 0.8rem;
        text-transform: capitalize;
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

@-moz-document url-prefix() {
    .c-more-info{
        &__creator{
            font-weight: 1000;
        }
    }
}
</style>
