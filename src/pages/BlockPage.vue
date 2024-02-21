<!-- eslint-disable max-len -->
<!-- eslint-disable max-len -->
<!-- eslint-disable max-len -->
<!-- eslint-disable max-len -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable no-unused-vars -->
<script lang="ts">

import { defineComponent } from 'vue';
import DateField from 'components/DateField.vue';
import TransactionTable from 'components/TransactionTable.vue';
import { BlockData } from 'src/types';
import { ethers } from 'ethers';

const defaultTab = 'overview';
const tabs = ['overview', 'transactions'];

export default defineComponent({
    name: 'BlockPage',
    components: {
        DateField,
        TransactionTable,
    },
    data: () => ({
        tab: '',
        block: '',
        blockData: null as BlockData | null,
        error: '',
        showDateAge: false,
    }),
    async mounted() {
        this.checkTabFromUrl();
        await this.loadBlock();
    },
    computed: {
        blockHeight() {
            return parseInt(this.block);
        },
        timestamp() {
            if (this.blockData) {
                return this.blockData.timestamp;
            }
            return 0;
        },
        transactionsCount() {
            if (this.blockData) {
                return this.blockData.transactionsCount;
            }
            return 0;
        },
        internalTrxCount() {
            return 0;
        },
        size() {
            if (this.blockData) {
                const size = ethers.BigNumber.from(this.blockData.size).toNumber();
                return `${size.toLocaleString()} bytes`;
            }
            return 0;
        },
        gasUsed() {
            if (this.blockData) {
                console.log('this.blockData.gasUsed', typeof this.blockData.gasUsed, this.blockData.gasUsed);
                const gas = ethers.BigNumber.from(this.blockData.gasUsed);
                try {
                    return gas.toNumber().toLocaleString();
                } catch (e) {
                    console.error(e);
                    return gas.toString();
                }
            }
            return 0;
        },
        gasLimit() {
            if (this.blockData) {
                console.log('this.blockData.gasLimit', typeof this.blockData.gasLimit, this.blockData.gasLimit);
                const gas = ethers.BigNumber.from(this.blockData.gasLimit);
                try {
                    return gas.toNumber().toLocaleString();
                } catch (e) {
                    console.error(e);
                    return gas.toString();
                }
            }
            return 0;
        },
        nonce() {
            if (this.blockData) {
                return this.blockData.nonce;
            }
            return '';
        },
        hash() {
            if (this.blockData) {
                return this.blockData.hash;
            }
            return '';
        },
        parentHash() {
            if (this.blockData) {
                return this.blockData.parentHash;
            }
            return '';
        },
    },
    watch: {
        '$route.params.block': {
            handler(newBlock) {
                if (this.block === newBlock) {
                    return;
                }
                this.block = newBlock;
                this.loadBlock();
            },
            immediate: true,
        },
        '$route.query.tab'(newTab) {
            this.tab = newTab || defaultTab;
        },
        tab(newTab) {
            this.$router.push({ query: { tab: newTab } });
        },
    },
    methods: {
        checkTabFromUrl() {
            const tabQueryParam = this.$route.query.tab as string;
            if (tabQueryParam && tabs.includes(tabQueryParam)) {
                this.tab = tabQueryParam;
            } else {
                this.tab = defaultTab;
            }
        },
        async loadBlock() {
            try {
                const blockResponse = await this.$indexerApi.get(`/block/${this.block}?includeAbi=true`);
                if(blockResponse){
                    this.blockData = blockResponse.data.results[0];
                }
            } catch (e) {
                this.error = this.$t('components.failed_to_fetch_transactions');
                console.error(e);
            }
        },
        prevBlock() {
            this.resetBlockData();
            this.$router.push({ name: 'block', params: { block: parseInt(this.block) - 1 } });
        },
        nextBlock() {
            this.resetBlockData();
            this.$router.push({ name: 'block', params: { block: parseInt(this.block) + 1 } });
        },
        resetBlockData() {
            this.blockData = null;
        },
    },
});

</script>
<template>
<div class="p-block">
    <div class="p-block__header">
        <span class="p-block__header-title">{{ $t('pages.blockpage.block') }}</span>
        <span class="p-block__header-block-num">#{{ blockHeight }}</span>
    </div>

    <q-tabs
        v-model="tab"
        class="p-block__tabs-tabs text-blue shadow-2"
        align="left"
    >
        <q-tab class="p-block__tabs-tab" name="overview" :label="$t('pages.blockpage.overview')" />
        <q-tab class="p-block__tabs-tab" name="transactions" :label="$t('pages.blockpage.transactions')" />
    </q-tabs>

    <div class="p-block__main-container">
        <div class="p-block__main-content">
            <q-tab-panels v-model="tab" class="p-block__panels">
                <q-tab-panel class="p-block__panel" name="overview">
                    <q-card class="p-block__card-section">
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.block_height_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.block_height') }}</div>
                            <div class="p-block__row-value">{{ blockHeight }}</div>
                            <div class="p-block__row-icon-btn p-block__row-icon-btn--left" @click="prevBlock">
                                <i class="fa fa-chevron-left small"></i>
                            </div>
                            <div class="p-block__row-icon-btn p-block__row-icon-btn--right" @click="nextBlock">
                                <i class="fa fa-chevron-right small"></i>
                            </div>
                        </div>
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.timestamp_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.timestamp') }}</div>
                            <div
                                class="p-block__row-value p-block__row-value--timestamp"
                                @click="showDateAge = !showDateAge"
                            >
                                <q-icon class="p-block__row-value-clock-icon" name="far fa-clock">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('components.click_to_change_format') }}
                                    </q-tooltip>
                                </q-icon>
                                <DateField :epoch="Math.round(timestamp / 1000)" :force-show-age="showDateAge"/>
                            </div>
                        </div>
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.transactions_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.transactions') }}</div>
                            <div class="p-block__row-value">
                                <router-link :to="{ query: { tab: 'transactions' } }">
                                    {{ $t('pages.blockpage.count_transactions', { count: transactionsCount }) }}
                                </router-link>
                                <template v-if="internalTrxCount > 0">
                                    &nbsp;{{ $t('pages.blockpage.and') }}&nbsp;
                                    <router-link :to="{ query: { tab: 'transactions' } }">
                                        {{ $t('pages.blockpage.count_int_transactions', { count: internalTrxCount }) }}
                                    </router-link>
                                </template>
                                {{ $t('pages.blockpage.in_this_block') }}
                            </div>
                        </div>
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.size_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.size') }}</div>
                            <div class="p-block__row-value">{{ size }}</div>
                        </div>
                    </q-card>
                    <q-card class="p-block__card-section">
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.gas_used_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.gas_used') }}</div>
                            <div class="p-block__row-value">{{ gasUsed }}</div>
                        </div>
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.gas_limit_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.gas_limit') }}</div>
                            <div class="p-block__row-value">{{ gasLimit }}</div>
                        </div>
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.nonce_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.nonce') }}</div>
                            <div class="p-block__row-value">{{ nonce }}</div>
                        </div>
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.hash_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.hash') }}</div>
                            <div class="p-block__row-value">{{ hash }}</div>
                        </div>
                        <div class="p-block__row">
                            <div class="p-block__row-tooltip">
                                <q-icon class="p-block__row-tooltip-icon info-icon" name="fas fa-info-circle">
                                    <q-tooltip anchor="bottom right" self="top start">
                                        {{ $t('pages.blockpage.parent_hash_tooltip') }}
                                    </q-tooltip>
                                </q-icon>
                            </div>
                            <div class="p-block__row-attribute">{{ $t('pages.blockpage.parent_hash') }}</div>
                            <div class="p-block__row-value">{{ parentHash }}</div>
                        </div>
                    </q-card>
                </q-tab-panel>
                <q-tab-panel class="p-block__panel" name="transactions">
                    <div
                        v-if="!error && blockData && blockData.transactionsCount > 0"
                    >
                        <TransactionTable :title="block" :filter="`block/${blockHeight}`"/>
                    </div>
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
    &__card-section {
        padding: 1.25rem!important;
        display: flex;
        flex-direction: column;
        margin-bottom: 16px;
    }
    &__row {
        display: flex;
        flex-direction: row;
        justify-content: left;
        align-items: center;
        padding: 0.5rem 0;
        gap: 5px;
    }
    &__row-tooltip {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    &__row-attribute {
        font-weight: 500;
        min-width: 230px;
    }
    &__row-value {
        margin-left: 1rem;
        &--hardcoded {
            color: #999;
        }
        &--timestamp {
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
        }
    }
    &__row-icon-btn {
        cursor: pointer;
        color: rgb(8, 29, 53);
        background-color: rgb(233, 236, 239);
        border: solid 1.25px rgb(233, 236, 239);
        height: 22px;
        width: 22px;
        border-radius: 6px;
        // center content with flex
        display: flex;
        justify-content: center;
        align-items: center;
        &--left {
            padding-right: 1px;
        }
        &--right {
            padding-left: 1px;
        }
    }
    &__separator {
        border: 1px solid #e0e0e0;
        margin: 1rem 0;
    }
}
</style>

