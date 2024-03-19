<script setup lang="ts">
import HomeLatestDataTableRow from 'src/pages/home/HomeLatestDataTableRow.vue';
import TransactionFeeField from 'components/TransactionFeeField.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import { indexerApi } from 'src/boot/telosApi';
import { onMounted, ref } from 'vue';
import { BlockData } from 'src/types';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
// import { ethers } from 'ethers'; // FIXME: remove

const $q = useQuasar();
const { t: $t } = useI18n();
// const locale = useI18n().locale.value; // FIXME: remove
const loading = ref(true);
// const blocks = ref<BlockData[]>([] as unknown as BlockData[]); // FIXME: remove
const blocks = ref<BlockData[]>([1, 2, 3, 4, 5, 6] as unknown as BlockData[]);

async function fetchBlocksPage() {
    console.log('fetchBlocksPage()', loading.value); // FIXME: remove
    const path = getPath();
    const result = await indexerApi.get(path);

    result.data.results = result.data.results.map((block: BlockData) => {
        block.blockHeight = +(block.number ?? 0);
        block.transactionsCount = +(block.transactionCount ?? 0);
        return block;
    });
    return result;
}

async function parseBlocks() {
    console.log('parseBlocks()', loading.value); // FIXME: remove
    loading.value = true;

    try {
        let response = await fetchBlocksPage();
        blocks.value = response.data.results;
        loading.value = false;
        console.log('blocks.value', blocks.value); // FIXME: remove
        console.log('loading.value', loading.value); // FIXME: remove
    } catch (e: unknown) {
        $q.notify({
            type: 'negative',
            message: $t('components.blocks.transaction.load_error'),
            caption: (e as {message:string}).message,
        });
        loading.value = false;
    }
}


function getPath() {
    let path = 'blocks?limit=6&includeCount=1';
    return path;
}

onMounted(() => {
    // eslint-disable-next-line no-constant-condition
    //if (1 > 0) { // FIXME: remove
    parseBlocks();
    //}
});

// FIXME: remove
// const gasUsedFor = (block: BlockData) => {
//     if (block) {
//         const gas = ethers.BigNumber.from(block.gasUsed);
//         try {
//             return gas.toNumber().toLocaleString(locale);
//         } catch (e) {
//             console.error(e);
//             return gas.toString();
//         }
//     }
//     return '0';
// };

const gasPrice = '0x754d490126';

</script>

<template>
<table class="c-latest-blocks">
    <HomeLatestDataTableRow v-for="block in blocks" :key="block.blockHeight" :loading="loading">
        <template v-slot:icon>
            <q-icon name="view_in_ar" size="24px" />
        </template>
        <template v-slot:column-one>
            <BlockField :block="block.blockHeight"/>
            <br>
            <DateField :epoch="block.timestamp / 1000" :force-show-age="true"/>
        </template>
        <template v-slot:column-two>

            <template v-if="block.transactionsCount > 0">
                <a :href="`/block/${block.blockHeight}?tab=transactions`">
                    {{
                        block.transactionsCount === 1
                            ? $t('components.blocks.count_transaction')
                            : $t('components.blocks.count_transactions', {
                                count: block.transactionsCount
                            })
                    }}
                </a>
            </template>
            <template v-else>
                {{
                    $t('components.blocks.count_transactions', { count: block.transactionsCount })
                }}
            </template>

            <br>

            {{ $t('components.blocks.in_this_block') }}

        </template>
        <template v-slot:column-three>
            <div>
                <TransactionFeeField
                    :showTotalGasFee="true"
                    :gasUsed="block.gasUsed"
                    :gasPrice="gasPrice"
                />
                TLOS
            </div>
        </template>
    </HomeLatestDataTableRow>
</table>
</template>

<style lang="scss">
.c-latest-blocks {
    width: 100%;
    border-collapse: collapse;
    max-height: 100px;
}
</style>
