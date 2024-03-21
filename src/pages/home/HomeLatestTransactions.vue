<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber } from 'ethers/lib/ethers';

import { indexerApi } from 'src/boot/telosApi';
import { prettyPrintCurrency } from 'src/antelope/wallets/utils/currency-utils';
import { WEI_PRECISION } from 'src/lib/utils';

import DateField from 'components/DateField.vue';
import TransactionField from 'components/TransactionField.vue';
import AddressField from 'src/components/AddressField.vue';
import HomeLatestDataTableRow from 'src/pages/home/HomeLatestDataTableRow.vue';

const $i18n = useI18n();
const locale = $i18n.locale.value;
const { t: $t } = $i18n;

interface Transaction {
    from: string;
    to: string;
    hash: string;
    timestamp: number;
    value: string;
}

const transactions = ref<Transaction[]>([]);

const loading = ref(true);

onBeforeMount(async () => {
    const response = await indexerApi.get('transactions?limit=6');
    transactions.value = response.data.results;
    loading.value = false;
});

function getTlosValue(value: string) {
    return prettyPrintCurrency(
        BigNumber.from(value),
        0,
        locale,
        false,
        'TLOS',
        false,
        WEI_PRECISION,
        true,
    );
}
</script>

<template>
<table class="c-home-latest-transactions__table">
    <HomeLatestDataTableRow v-for="index in [0, 1, 2, 3, 4, 5]" :key="index" :loading="loading">
        <template v-slot:icon>
            <q-icon size="20px" name="far fa-file-alt" />
        </template>

        <template v-slot:column-one>
            <TransactionField :transaction-hash="transactions[index].hash" />
            <br>
            <DateField :epoch="transactions[index].timestamp / 1000" :force-show-age="true" :muted-text="true" />
        </template>

        <template v-slot:column-two>
            {{ $t('pages.from') }}
            <AddressField :address="transactions[index].from" :truncate="8" :hide-contract-icon="true" />
            <br>
            {{ $t('pages.to') }}
            <AddressField :address="transactions[index].to" :truncate="8" :hide-contract-icon="true" />
        </template>

        <template v-slot:column-three>
            <div class="c-home-latest-transactions__value">
                {{ getTlosValue(transactions[index].value) }}
                <q-tooltip anchor="bottom right" self="top end">
                    {{ $t('components.contract_tab.amount') }}
                </q-tooltip>
            </div>
        </template>
    </HomeLatestDataTableRow>
</table>
</template>

<style lang="scss">
.c-home-latest-transactions {
    &__table {
        width: 100%;
        border-collapse: collapse;
    }

    &__icon-container {
        height: 48px;
        width: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background-color: $grey-3;

        body.body--dark & {
            background-color: $grey-10;
        }
    }

    &__value {
        @include token-value;
    }
}</style>
