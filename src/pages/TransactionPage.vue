<script lang="ts" setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import LogsViewer from 'components/Transaction/LogsViewer.vue';
import InternalTxns from 'components/Transaction/InternalTxns.vue';
import TransactionOverview from 'src/components/TransactionOverview.vue';

import { EvmTransactionExtended } from 'src/types';
import { loadTransaction } from 'src/lib/transaction-utils';

const { t: $t } = useI18n();
const route = useRoute();
const router = useRouter();

const defaultTab = 'overview';
const tab = ref<string>(route.query.tab as string || defaultTab);
const trxNotFound = ref(false);
const hash = ref('');
const trx = ref<EvmTransactionExtended | null>(null);

const updateData = async () => {
    trx.value = await loadTransaction(hash.value);
    trxNotFound.value = !trx.value;
    if (!trx.value) {
        tab.value = defaultTab;
    }
};

watch(() => route.params.hash, async (newValue) => {
    if (!newValue || hash.value === newValue) {
        return;
    }
    hash.value = typeof newValue === 'string' ? newValue : newValue[0];
    updateData();
}, { immediate: true });

watch(() => route.query, () => {
    updateData();
});

watch(tab, (newTab) => {
    router.replace({ query: { ...route.query, tab: newTab } });
});

const prevTransaction = () => {
    console.error('prevTransaction() NOT IMPLEMENTED');
};

const nextTransaction = () => {
    console.error('nextTransaction() NOT IMPLEMENTED');
};

</script>


<template>

<q-page class="c-transactions">

    <div class="c-transactions__header">
        <span class="c-transactions__header-title">{{ $t('pages.transaction.page_title') }}</span>
        <div class="c-transactions__header-nav-btn c-transactions__header-nav-btn--left" @click="prevTransaction">
            <i class="fa fa-chevron-left small"></i>
        </div>
        <div class="c-transactions__header-nav-btn c-transactions__header-nav-btn--right" @click="nextTransaction">
            <i class="fa fa-chevron-right small"></i>
        </div>
    </div>

    <q-tabs
        v-model="tab"
        active-class="c-transactions__tabs-tab--active"
        content-class="c-transactions__tabs-content"
        indicator-color="transparent"

        class="c-transactions__tabs"
    >
        <q-tab class="c-transactions__tabs-tab" name="overview" :label="$t('pages.transaction.overview')" />
        <q-tab
            v-if="trx?.logsArray && Array.isArray(trx?.logsArray) && trx?.logsArray.length > 0"
            class="c-transactions__tabs-tab"
            name="logs"
            :label="$t('pages.transaction.logs')"
        />
        <q-tab
            v-if="trx"
            class="c-transactions__tabs-tab"
            name="internal"
            :label="$t('pages.transaction.internal')"
        />
    </q-tabs>

    <div class="c-transactions__main-container">
        <div class="c-transactions__main-content">
            <q-tab-panels
                v-model="tab"
                class="c-transactions__panels"
                animated
                transition-next="fade"
                transition-prev="fade"
            >
                <q-tab-panel class="c-transactions__panel c-transactions__panel--overview" name="overview">
                    <!-- Transaction not found -->
                    <q-card
                        v-if="trxNotFound"
                        class="c-transactions__panel-not-found"
                    >
                        <q-card-section>
                            <q-item>
                                <q-item-section avatar>
                                    <q-avatar>
                                        <i class="fa fa-exclamation-triangle"></i>
                                    </q-avatar>
                                </q-item-section>
                                <q-item-section>
                                    <q-item-label>{{ $t('pages.transaction.not_found') }}</q-item-label>
                                    <q-item-label class="c-transactions__panel-not-found-hash" caption> {{ hash }}</q-item-label>
                                </q-item-section>
                            </q-item>
                        </q-card-section>
                    </q-card>

                    <!-- Transaction Overview -->
                    <div v-else class="c-transactions__panel-content--overview c-transactions__panel-content">
                        <TransactionOverview
                            :trx="trx"
                        />
                    </div>
                </q-tab-panel>
                <q-tab-panel class="c-transactions__panel c-transactions__panel--logs" name="logs">
                    <q-card class="c-transactions__panel-content--logs c-transactions__panel-content">
                        <LogsViewer
                            v-if="trx"
                            :trx="trx"
                            :contract="trx?.contract"
                            :logs="trx?.logsArray"
                        />
                    </q-card>
                </q-tab-panel>
                <q-tab-panel class="c-transactions__panel c-transactions__panel" name="internal">
                    <q-card class="c-transactions__panel-content--internal c-transactions__panel-content">
                        <InternalTxns
                            v-if="trx"
                            :transaction="trx"
                        />
                    </q-card>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>

</q-page>
</template>

<style lang="scss">
.c-transactions {
    @include page-container;

    &__header {
        @include page-header;
        &-nav-btn {
            @include page-header-nav-btn;
            display: none; // remove this line to enable the buttons
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
    &__panel-content {
        min-height: 250px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        &--logs, &--internal {
            padding-top: 20px;
        }
    }
    &__panel-not-found {
        padding: 30px 0px;
        &-hash {
            padding-top: 4px;
            word-break: break-all;
        }
        @media screen and (min-width: $breakpoint-md-min) {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100%;
            padding: 30px 0px;
        }
    }
}
</style>
