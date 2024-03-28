<script setup lang="ts">

import { ref, watch, onMounted, computed, toRaw } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { indexerApi } from 'src/boot/telosApi';
import TransactionTable from 'components/TransactionTable.vue';
import BlockOverview from 'components/BlockOverview.vue';
import { BlockData } from 'src/types';

const router = useRouter();
const route = useRoute();
const { t: $t } = useI18n();

const defaultTab = 'overview';
const tabs = ['overview', 'transactions'];

const tab = ref(defaultTab);
const block = ref(0);
const blockNumber = computed(() => block.value ?? 0);
const blockData = ref<BlockData | null>(null);

const transactionsCount = computed(() => blockData.value ? blockData.value.transactionsCount : 0);

// Methods

function prevBlock() {
    router.push({ name: 'block', params: { block: block.value - 1 } });
}

function nextBlock() {
    router.push({ name: 'block', params: { block: block.value + 1 } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function visitNativeBlockExplorer(extraData: any) {
    const explorerLink = process.env.NETWORK_EXPLORER;
    window.open(`${explorerLink}/block/${extraData}`, '_blank');
}

const loadBlockData = async () => {
    try {
        if (blockNumber.value <= 0) {
            return;
        }
        const response = await indexerApi.get(`/block/${blockNumber.value}`);
        blockData.value = toRaw(response.data?.results?.[0]) as BlockData;
    } catch (error) {
        console.error('Failed to fetch block data:', error);
        blockData.value = null;
    }
};

// update url on block change
watch(block, (newBlock) => {
    router.push({ params: { block: newBlock } });
    loadBlockData();
});

watch(() => route.params.block, (newBlock) => {
    const blockNumber = parseInt(newBlock as string);
    if (block.value === blockNumber) {
        return;
    }
    block.value = blockNumber;
}, { immediate: true });

watch(() => route.query.tab, (newTab) => {
    const str = newTab as string;
    tab.value = tabs.includes(str) ? str : defaultTab;
});

watch(tab, (newTab) => {
    router.push({ query: { tab: newTab } });
});

onMounted(() => {
    const tabQueryParam = route.query.tab as string;
    tab.value = tabs.includes(tabQueryParam) ? tabQueryParam : defaultTab;
});
</script>

<template>
<q-page class="c-block">
    <div class="c-block__header">
        <span class="c-block__header-title">{{ $t('pages.blockpage.block') }}</span>
        <span class="c-block__header-block-num">#{{ block }}</span>
    </div>

    <q-tabs
        v-model="tab"
        dense
        active-class="c-block__tabs-tab--active"
        content-class="c-block__tabs-content"
        indicator-color="transparent"
        class="c-block__tabs"
    >
        <q-tab class="c-block__tabs-tab" name="overview" :label="$t('pages.blockpage.overview')" />
        <q-tab
            v-if="transactionsCount > 0"
            class="c-block__tabs-tab"
            name="transactions"
            :label="$t('pages.blockpage.transactions')"
        />
    </q-tabs>

    <div class="c-block__main-container">
        <div class="c-block__main-content">
            <q-tab-panels
                v-model="tab"
                class="c-block__panels"
                animated
                transition-next="fade"
                transition-prev="fade"
            >
                <q-tab-panel class="c-block__panel" name="overview">
                    <BlockOverview
                        :data="blockData"
                        @prev-block="prevBlock"
                        @next-block="nextBlock"
                        @trx-table="tab = 'transactions'"
                        @extra-data="visitNativeBlockExplorer"
                    />
                </q-tab-panel>
                <q-tab-panel class="c-block__panel" name="transactions">
                    <TransactionTable :title="block.toString()" :block="block"/>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>

</q-page>
</template>
<style lang="scss">

.c-block {
    @include page-container;

    &__header {
        @include page-header;
        &-block-num {
            font-size: 1.5rem;
            margin-left: 10px;
        }
    }

    &__tabs {
        @include tabs-container;
    }

    &__main-container {
        background: transparent !important;
    }
    &__main-content {
        padding: 0px;
    }
    &__panels {
        background: transparent;
        --v-overflow: visible;
        overflow: visible !important;
    }
    &__panel {
        padding: 0px;
    }
}

</style>

