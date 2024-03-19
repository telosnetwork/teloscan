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
});

</script>

<template>
<div>
    <q-card class="c-more-info">
        <q-card-section class="c-more-info__header">
            {{ $t('pages.more_info') }}
        </q-card-section>
        <q-card-section>
            <div>
                {{ $t('pages.contract_creator') }}
            </div>
            <AddressField
                :address="props.address"
                :truncate="22"
            />
            <CopyButton
                :text="props.address"
                accompanyingText=""
                description="creator address"
                class="c-more-info__copy"
            />
            at txn
            <TransactionField :transaction-hash="props.transaction"/>
        </q-card-section>
    </q-card>
</div>
</template>

<style lang="scss">
.c-more-info{
    height:100%;
    text-transform: uppercase;

    &__copy{
        display: inline;
        font-size: 16px;
    }
    &__header {
        font-size: 18px;
        font-weight: 600;
    }
}
</style>
