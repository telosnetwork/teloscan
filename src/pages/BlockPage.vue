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
const block = ref('');
const blockHeight = computed(() => parseInt(block.value ?? '0'));
const blockData = ref<BlockData | null>(null);

const transactionsCount = computed(() => blockData.value ? blockData.value.transactionsCount : 0);

// Methods

function prevBlock() {
    router.push({ name: 'block', params: { block: parseInt(block.value) - 1 } });
}

function nextBlock() {
    router.push({ name: 'block', params: { block: parseInt(block.value) + 1 } });
}

const loadBlockData = async () => {
    blockData.value = null;
    try {
        if (blockHeight.value <= 0) {
            return;
        }
        const response = await indexerApi.get(`/block/${blockHeight.value}`);
        blockData.value = toRaw(response.data?.results?.[0]) as BlockData;
    } catch (error) {
        console.error('Failed to fetch block data:', error);
    }
};

// Watchers

// cuando block cambie hay que actualizar la url
watch(block, (newBlock) => {
    router.push({ params: { block: newBlock } });
    loadBlockData();
});
watch(() => route.params.block, (newBlock) => {
    if (block.value === newBlock) {
        return;
    }
    block.value = newBlock as string;
    // loadBlock();
}, { immediate: true });

watch(() => route.query.tab, (newTab) => {
    const str = newTab as string;
    tab.value = tabs.includes(str) ? str : defaultTab;
});

watch(tab, (newTab) => {
    router.push({ query: { tab: newTab } });
});

// Mounted lifecycle hook
onMounted(() => {
    const tabQueryParam = route.query.tab as string;
    tab.value = tabs.includes(tabQueryParam) ? tabQueryParam : defaultTab;
    // loadBlock();
});
</script>

<template>
<div class="p-block">
    <div class="p-block__header">
        <span class="p-block__header-title">{{ $t('pages.blockpage.block') }}</span>
        <span class="p-block__header-block-num">#{{ block }}</span>
    </div>

    <q-tabs
        v-model="tab"
        class="p-block__tabs-tabs text-blue shadow-2"
        align="left"
    >
        <q-tab class="p-block__tabs-tab" name="overview" :label="$t('pages.blockpage.overview')" />
        <q-tab
            v-if="transactionsCount > 0"
            class="p-block__tabs-tab"
            name="transactions"
            :label="$t('pages.blockpage.transactions')"
        />
    </q-tabs>

    <div class="p-block__main-container">
        <div class="p-block__main-content">
            <q-tab-panels v-model="tab" class="p-block__panels">
                <q-tab-panel class="p-block__panel" name="overview">
                    <BlockOverview
                        :data="blockData"
                        @prev-block="prevBlock"
                        @next-block="nextBlock"
                        @trx-table="tab = 'transactions'"
                    />
                </q-tab-panel>
                <q-tab-panel class="p-block__panel" name="transactions">
                    <TransactionTable :title="block" :filter="`block/${block}`"/>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>

</div>
</template>

<style lang="scss">
.p-block {
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    padding-top: 35px;
    padding-right: calc(var(--bs-gutter-x) * .5);
    padding-left: calc(var(--bs-gutter-x) * .5);
    margin-right: auto;
    margin-left: auto;
    width: 100%;
    max-width: 1200px;
    &__header {
        display: flex;
        justify-content: left;
        gap: 10px;
        align-items: baseline;
        margin-bottom: 1.5rem;
        vertical-align: text-bottom;
        &-title {
            font-size: 1.4rem;
            font-weight: bold;
        }
    }

    &__tabs-tabs {
        display: inline-flex;
    }

    &__main-container {
        background: transparent !important;
    }
    &__main-content {
        padding: 0px;
    }
    &__panels {
        background: transparent;
    }
    &__panel {
        padding: 0px;
    }
}
</style>

