<script setup lang="ts">
import HomeLatestDataTableRow from 'src/pages/home/HomeLatestDataTableRow.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import { indexerApi } from 'src/boot/telosApi';
import { onMounted, ref } from 'vue';
import { BlockData } from 'src/types';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ethers } from 'ethers';
import { WEI_PRECISION, formatWei } from 'src/lib/utils';

const $q = useQuasar();
const { t: $t } = useI18n();
const loading = ref(true);
const blocks = ref<BlockData[]>([1, 2, 3, 4, 5, 6] as unknown as BlockData[]);

async function fetchBlocksPage() {
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
    loading.value = true;

    try {
        let response = await fetchBlocksPage();
        blocks.value = response.data.results;
        loading.value = false;
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
    parseBlocks();
});

const gasUsedFor = (block: BlockData) => {
    if (block) {
        try {
            const wei = ethers.BigNumber.from(block.gasUsed).mul(gasPrice);
            return `${formatWei(wei, WEI_PRECISION, 4)} TLOS`;
        } catch (e) {
            console.error(e);
        }
    }
    return '0.0000 TLOS';
};

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
            <div class="c-latest-blocks__gas-used">
                {{ gasUsedFor(block) }}
                <q-tooltip anchor="bottom right" self="top end">
                    {{ $t('components.blocks.gas_used_tooltip') }}
                </q-tooltip>
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

    &__gas-used {
        border: 1px solid var(--border-color);
        border-radius: 8px;
        padding: 4px 8px;
        font-size: 0.65rem;
        font-weight: bold;
        width: max-content;
    }
}
</style>
