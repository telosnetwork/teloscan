<script setup lang="ts">
import HomeLatestDataTableRow from 'src/pages/home/HomeLatestDataTableRow.vue';
import BlockField from 'components/BlockField.vue';
import DateField from 'components/DateField.vue';
import { prettyPrintCurrency } from 'src/antelope/wallets/utils/currency-utils';
import { indexerApi } from 'src/boot/telosApi';
import { onMounted, ref, toRaw } from 'vue';
import { BlockData } from 'src/types';
import { useQuasar } from 'quasar';
import { useI18n } from 'vue-i18n';
import { ethers } from 'ethers';
import { WEI_PRECISION } from 'src/lib/utils';

type BlockDataOrLoading = BlockData | null;

const $q = useQuasar();
const $i18n = useI18n();
const { t: $t } = $i18n;
const locale = $i18n.locale.value;
const blocks = ref<BlockDataOrLoading[]>([null, null, null, null, null, null]);
const gasPrice = '0x754d490126';
const CACHE_KEY = 'latest-blocks';
const blocksCache = ref<{
    range: { start: number },
    relevantBlocks: BlockData[],
}>({
    range: { start: 0 },
    relevantBlocks: [],
});

function saveCache() {
    try {
        const relevantBlocks = toRaw(blocks.value);
        // if the first block has no transactions, we need to remove it
        if (relevantBlocks[0]?.transactionsCount === 0) {
            relevantBlocks.shift();
        }
        blocksCache.value.relevantBlocks = relevantBlocks as BlockData[];
        localStorage.setItem(CACHE_KEY, JSON.stringify(blocksCache.value));
    } catch (e) {
        console.error(e);
    }
}

function loadCache() {
    const cache = localStorage.getItem(CACHE_KEY);
    if (cache) {
        try {
            blocksCache.value = JSON.parse(cache);
        } catch (e) {
            console.error(e);
        }
    }
}


async function fetchBlocksWithTransactions(firstPage: BlockData[]) {
    let currentPage = 1;
    const maxBlocksToShow = 6;
    const start = firstPage[0].blockNumber;
    let end = firstPage[firstPage.length - 1].blockNumber;

    // verify if we have enough blocks in the first page
    let notEmptyBlocks = firstPage.filter(b => b.transactionsCount > 0);

    // we need to overwrite the indexes from 1 to 5 of the blocks array
    notEmptyBlocks.forEach((block, index) => {
        if (index < maxBlocksToShow - 1) {
            blocks.value[index + 1] = block;
        }
    });


    while (blocks.value.filter(b => b !== null).length < maxBlocksToShow) {
        let response = await fetchBlocksPage(currentPage);
        end = response.data.results[response.data.results.length - 1].blockNumber;
        notEmptyBlocks = response.data.results.filter((b: BlockData) => b.transactionsCount > 0);

        // we need to overwrite the indexes from 1 to 5 of the blocks array
        let index = blocks.value.filter(b => b !== null).length;
        notEmptyBlocks.forEach((block) => {
            if (index < maxBlocksToShow) {
                blocks.value[index++] = block;
            }
        });

        if (index === maxBlocksToShow) {
            // we have enough blocks
            break;
        }

        // Verify if next page is in cache
        if (end <= blocksCache.value.range.start) {
            // complete the blocks array with the cached blocks
            blocksCache.value.relevantBlocks.forEach((block) => {
                if (index < maxBlocksToShow) {
                    blocks.value[index++] = block;
                }
            });
            break;
        }

        currentPage++;
    }

    blocksCache.value.range.start = start;
}

async function fetchBlocksPage(page: number) {
    const path = getPath(page);
    const result = await indexerApi.get(path);

    // workaround to avoid indexer typos
    result.data.results = result.data.results.map((block: BlockData) => {
        block.blockHeight = +(block.number ?? 0);
        block.transactionsCount = +(block.transactionCount ?? 0);
        return block;
    });

    return result;
}

async function fetchBlocks() {
    try {
        let response = await fetchBlocksPage(0);
        blocks.value[0] = response.data.results[0];
        // remove the first block to avoid repeating it
        response.data.results.shift();
        await fetchBlocksWithTransactions(response.data.results).then(() => {
            saveCache();
        });
    } catch (e: unknown) {
        $q.notify({
            type: 'negative',
            message: $t('components.blocks.transaction.load_error'),
            caption: (e as {message:string}).message,
        });
    }
}

function getPath(page = 0) {
    const offset = page * 100;
    let path = `blocks?limit=100&includeCount=true&offset=${offset}`;
    return path;
}

const gasUsedFor = (block: BlockData) => {
    if (block) {
        try {
            const wei = ethers.BigNumber.from(block.gasUsed).mul(gasPrice);
            return prettyPrintCurrency(
                ethers.BigNumber.from(wei.toHexString()),
                2,
                locale,
                false,
                'TLOS',
                false,
                WEI_PRECISION,
                false,
            );
        } catch (e) {
            console.error(e);
        }
    }
    return '0.00 TLOS';
};

// lifecycle
onMounted(() => {
    loadCache();
    fetchBlocks();
});

</script>

<template>
<table class="c-latest-blocks">
    <HomeLatestDataTableRow v-for="(block, index) in blocks" :key="index" :loading="block === null">
        <template v-slot:column-one>
            <q-icon name="view_in_ar" size="24px" />
        </template>
        <template v-slot:column-two>
            <BlockField
                class="c-latest-blocks__number"
                :block="block?.blockNumber"
            />
            <DateField
                class="c-latest-blocks__timestamp"
                :epoch="(block?.timestamp ?? 0) / 1000"
                :force-show-age="true"
                :muted-text="true"
            />
        </template>
        <template v-slot:column-three>

            <template v-if="(block?.transactionsCount ?? 0) > 0">
                <a :href="`/block/${block?.blockNumber}?tab=transactions`">
                    {{
                        block?.transactionsCount === 1
                            ? $t('components.blocks.count_transaction')
                            : $t('components.blocks.count_transactions', {
                                count: block?.transactionsCount
                            })
                    }}
                </a>
            </template>
            <template v-else>
                {{
                    $t('components.blocks.count_transactions', { count: block?.transactionsCount })
                }}
            </template>

            <span class="c-latest-blocks__aux-text">{{ $t('components.blocks.in_this_block') }}</span>

            <div v-if="block" class="c-latest-blocks__gas-used c-latest-blocks__gas-used--mobile">
                {{ gasUsedFor(block) }}
                <q-tooltip anchor="bottom right" self="top end">
                    {{ $t('components.blocks.gas_used_tooltip') }}
                </q-tooltip>
            </div>

        </template>
        <template v-slot:column-four>
            <div v-if="block" class="c-latest-blocks__gas-used c-latest-blocks__gas-used--desktop">
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

    &__number {
        margin-right:5px;

        @media screen and (min-width: $breakpoint-lg-min) {
            margin-right: 0px;
            &::after {
                content: ' ';
                display: block;
            }
        }
    }

    &__aux-text {
        display: none;
        @media screen and (min-width: $breakpoint-lg-min) {
            display: block;
        }
    }

    &__gas-used {
        @include token-value;
        display: none;
        &--mobile {
            display: inline-block;
            margin-left: 10px;
        }
        @media screen and (min-width: $breakpoint-lg-min) {
            &--desktop {
                display: block;
            }
            &--mobile {
                display: none;
            }
        }
    }
}
</style>
