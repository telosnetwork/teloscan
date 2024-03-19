<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import { indexerApi } from 'src/boot/telosApi';
import { truncateAddress } from 'src/antelope/wallets/utils/text-utils';
import { formatTimePeriod } from 'src/lib/date-utils';

import HomeLatestDataTableRow from 'src/pages/home/HomeLatestDataTableRow.vue';

const { t: $t } = useI18n();

// eztodo real type
const transactions = ref<{ from: string, to: string, hash: string, timestamp: number }[]>([]);

const loading = computed(() => transactions.value.length === 0);

onBeforeMount(async () => {
    const response = await indexerApi.get('transactions?limit=6');
    transactions.value = response.data.results;
});

function truncateTxHash(hash: string) {
    return hash.substring(0, 12).concat('...');
}

function formatTxTime(time: number) {
    const difference = Date.now() - time;
    return $t('antelope.words.time_ago', { time: formatTimePeriod(difference / 1000, $t) });
}
</script>

<template>
<!-- eztodo i18n -->
<table class="c-home-latest-transactions__table">
    <HomeLatestDataTableRow v-for="index in [0, 1, 2, 3, 4, 5]" :key="index" :loading="loading">
        <template v-slot:icon>
            <q-icon size="20px" name="far fa-file-alt" />
        </template>

        <template v-slot:column-one>
            <router-link :to="{ name: 'transaction', params: { hash: transactions[index].hash } }">
                {{ truncateTxHash(transactions[index].hash) }}
            </router-link>
            <br>
            {{ formatTxTime(transactions[index].timestamp) }}
        </template>

        <template v-slot:column-two>
            From
            <router-link :to="{ name: 'address', params: { address: transactions[index].from } }">
                {{ truncateAddress(transactions[index].from) }}
            </router-link>
            <br>
            To
            <router-link :to="{ name: 'address', params: { address: transactions[index].to } }">
                {{ truncateAddress(transactions[index].to) }}
            </router-link>
        </template>

        <template v-slot:column-three>
            <span>Some text</span>
            <br>
            <span>Some more text</span>
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
}
</style>
