<script setup lang="ts">
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { BigNumber } from 'ethers/lib/ethers';

import { prettyPrintCurrency } from 'src/core/wallets/utils/currency-utils';

import DateField from 'components/DateField.vue';
import TransactionField from 'components/TransactionField.vue';
import AddressField from 'src/components/AddressField.vue';
import HomeLatestDataTableRow from 'src/pages/home/HomeLatestDataTableRow.vue';
import { useQuasar } from 'quasar';
import { useChainStore } from 'src/core';
import { useRoute } from 'vue-router';

const $q = useQuasar();
const $i18n = useI18n();
const $route = useRoute();
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

const truncateHash = computed(() => $q.screen.width > 1024 && $q.screen.width <= 1240 ? 8 : 20);

const update = async () => {
    const indexerApi = useChainStore().currentChain.settings.getIndexerApi();
    const response = await indexerApi.get('v1/transactions?limit=6');
    transactions.value = response.data.results;
    loading.value = false;
};

onBeforeMount(async () => {
    update();
});

function getTlosValue(value: string) {
    return prettyPrintCurrency(
        BigNumber.from(value),
        0,
        locale,
        false,
        useChainStore().currentChain.settings.getSystemToken().symbol,
        false,
        useChainStore().currentChain.settings.getSystemToken().decimals,
        true,
    );
}

watch(() => $route.query, () => {
    loading.value = true;
    update();
});

</script>

<template>
<table class="c-home-latest-transactions__table">
    <HomeLatestDataTableRow v-for="index in [0, 1, 2, 3, 4, 5]" :key="index" :loading="loading">
        <template v-slot:column-one>
            <q-icon size="20px" name="far fa-file-alt" />
        </template>

        <template v-slot:column-two>
            <div>
                <TransactionField
                    class="c-home-latest-transactions__hash"
                    :transaction-hash="transactions[index].hash"
                    :truncate="truncateHash"
                />
            </div>
            <div>
                <DateField
                    class="c-home-latest-transactions__timestamp"
                    :epoch="transactions[index].timestamp / 1000"
                    :force-show-age="true"
                    :muted-text="true"
                />
            </div>
        </template>

        <template v-slot:column-three>
            <div class="c-home-latest-transactions__from-to">
                {{ $t('pages.from') }}
                <AddressField :address="transactions[index].from" :truncate="8" :hide-contract-icon="true" />
            </div>
            <div class="c-home-latest-transactions__from-to">
                {{ $t('pages.to') }}
                <AddressField
                    :address="transactions[index].to"
                    :truncate="8"
                    :hide-contract-icon="true"
                    :class="'c-home-latest-transactions__to-address'"
                />
                <div class="c-home-latest-transactions__value c-home-latest-transactions__value--mobile">
                    {{ getTlosValue(transactions[index].value) }}
                    <q-tooltip anchor="bottom right" self="top end">
                        {{ $t('components.contract_tab.amount') }}
                    </q-tooltip>
                </div>
            </div>
        </template>

        <template v-slot:column-four>
            <div class="c-home-latest-transactions__value c-home-latest-transactions__value--desktop">
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

    &__hash {
        margin-right:5px;

        @media screen and (min-width: $latest-data-breakpoint) {
            margin-right: 0px;
            &::after {
                content: ' ';
                display: block;
            }
        }
    }

    &__to-address {
        min-width: unset;
    }

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

    &__from-to {
        // display: flex;
        // align-items: center;
        // gap: 5px;
        // margin-bottom: 5px;

        // no break
        white-space: nowrap;
    }

    &__value {
        @include token-value;
        display: none;
        &--mobile {
            display: inline-block;
            margin-left: 10px;
        }
        @media screen and (min-width: $latest-data-breakpoint) {
            &--desktop {
                display: block;
            }
            &--mobile {
                display: none;
            }
        }
    }
}</style>
