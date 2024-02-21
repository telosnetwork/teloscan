<!-- eslint-disable max-len -->
<!-- eslint-disable max-len -->
<!-- eslint-disable max-len -->
<!-- eslint-disable max-len -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable no-unused-vars -->
<script lang="ts">

import { defineComponent } from 'vue';
import DateField from 'components/DateField.vue';
import { BlockData } from 'src/types';
import { ethers } from 'ethers';


export default defineComponent({
    name: 'BlockPage',
    components: { DateField },
    data: () => ({
        tab: 'overview',
        block: '',
        blockData: null as BlockData | null,
        error: '',
        showDateAge: false,
    }),
    async mounted() {
        await this.loadBlock();
    },
    computed: {
        blockHeight() {
            return parseInt(this.block);
        },
        status() {
            return 'finalized';
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
        Withdrawals() {
            if (this.blockData) {
                return this.blockData.transactionsCount;
            }
            return 0;
        },
        size() {
            if (this.blockData) {
                //const size = ethers.utils.formatUnits(this.blockData.size, 'wei');
                const size = ethers.BigNumber.from(this.blockData.size).toNumber();
                return `${size} bytes`;
            }
            return 0;
        },
        gasUsed() {
            if (this.blockData) {
                console.log('this.blockData.gasUsed', typeof this.blockData.gasUsed, this.blockData.gasUsed);
                return parseInt(this.blockData.gasUsed, 16);
            }
            return 0;
        },
        gasLimit() {
            if (this.blockData) {
                console.log('this.blockData.gasLimit', typeof this.blockData.gasLimit, this.blockData.gasLimit);
                return parseInt(this.blockData.gasLimit, 16);
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
        stateRoot() {
            if (this.blockData) {
                return this.blockData.stateRoot;
            }
            return '';
        },
        transactionsRoot() {
            if (this.blockData) {
                return this.blockData.transactionsRoot;
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
    },
    methods: {
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
<div class="p-block-page">
    <div class="p-block-page__header">
        <span class="p-block-page__header-title">{{ $t('pages.blockpage.block') }}</span>
        <span class="p-block-page__header-block-num">#{{ blockHeight }}</span>
    </div>

    <q-tabs
        v-model="tab"
        class="p-block-page__tabs-tabs text-blue shadow-2"
        align="left"
    >
        <q-tab class="p-block-page__tabs-tab" name="overview" :label="$t('pages.blockpage.overview')" />
        <q-tab class="p-block-page__tabs-tab" name="consensus-info" :label="$t('pages.blockpage.consensus_info')" />
        <q-tab class="p-block-page__tabs-tab" name="mev-info" :label="$t('pages.blockpage.mev_info')" />
    </q-tabs>

    <div class="p-block-page__main-container">
        <div class="p-block-page__main-content">
            <q-tab-panels v-model="tab" class="p-block-page__panels">
                <q-tab-panel class="p-block-page__panel" name="overview">
                    <q-card class="p-block-page__card-section">
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.block_height') }}</div>
                            <div class="p-block-page__row-value">{{ blockHeight }}</div>
                            <div class="p-block-page__row-icon-btn" @click="prevBlock">
                                <i class="fa fa-chevron-left small"></i>
                            </div>
                            <div class="p-block-page__row-icon-btn" @click="nextBlock">
                                <i class="fa fa-chevron-right small"></i>
                            </div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.status') }}</div>
                            <div class="p-block-page__row-value">{{ status }}</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.timestamp') }}</div>
                            <div class="p-block-page__row-value">
                                <DateField :epoch="Math.round(timestamp / 1000)" :force-show-age="showDateAge"/>
                            </div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.proposed_on') }}</div>
                            <div class="p-block-page__row-value p-block-page__row-value--hardcoded">
                                Block proposed on slot 8462645, epoch 264457
                            </div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.transactions') }}</div>
                            <div class="p-block-page__row-value">
                                {{ transactionsCount }} transactions in this block
                            </div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.withdrawals') }}</div>
                            <div class="p-block-page__row-value p-block-page__row-value--hardcoded">
                                0 withdrawals in this block</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.fee_recipient') }}</div>
                            <div class="p-block-page__row-value p-block-page__row-value--hardcoded">0x...</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.block_reward') }}</div>
                            <div class="p-block-page__row-value p-block-page__row-value--hardcoded">
                                0.048789575882690142 TLOS (0 + 0.607287151157049444 - 0.558497575274359302)
                            </div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.total_difficulty') }}</div>
                            <div class="p-block-page__row-value p-block-page__row-value--hardcoded">
                                58,750,003,716,598,352,816,469
                            </div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.size') }}</div>
                            <div class="p-block-page__row-value">{{ size }}</div>
                        </div>
                        <hr class="p-block-page__separator">
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.gas_used') }}</div>
                            <div class="p-block-page__row-value">{{ gasUsed }}</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.gas_limit') }}</div>
                            <div class="p-block-page__row-value">{{ gasLimit }}</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.base_fee_per_gas') }}</div>
                            <div class="p-block-page__row-value p-block-page__row-value--hardcoded">
                                0.000000001 ETH
                            </div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.burnt_fees') }}</div>
                            <div class="p-block-page__row-value p-block-page__row-value--hardcoded">0.0 TLOS</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.extra_data') }}</div>
                            <div class="p-block-page__row-value">{{ blockData?.extraData }}</div>
                        </div>
                    </q-card>
                    <q-card class="p-block-page__card-section">
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.hash') }}</div>
                            <div class="p-block-page__row-value">{{ hash }}</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.parent_hash') }}</div>
                            <div class="p-block-page__row-value">{{ parentHash }}</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.state_root') }}</div>
                            <div class="p-block-page__row-value">{{ stateRoot }}</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.withdrawals_root') }}</div>
                            <div class="p-block-page__row-value">{{ transactionsRoot }}</div>
                        </div>
                        <div class="p-block-page__row">
                            <div class="p-block-page__row-attribute">{{ $t('pages.blockpage.nonce') }}</div>
                            <div class="p-block-page__row-value">{{ nonce }}</div>
                        </div>
                    </q-card>
                </q-tab-panel>
                <q-tab-panel class="p-block-page__panel" name="consensus-info">
                    <h1>Consensus Info</h1>
                </q-tab-panel>
                <q-tab-panel class="p-block-page__panel" name="mev-info">
                    <h1>MEV Info</h1>
                </q-tab-panel>
            </q-tab-panels>
        </div>
    </div>

</div>
</template>

<style lang="scss">
.p-block-page {
    --bs-gutter-x: 1.5rem;
    --bs-gutter-y: 0;
    padding-top: 35px;
    padding-right: calc(var(--bs-gutter-x) * .5);
    padding-left: calc(var(--bs-gutter-x) * .5);
    margin-right: auto;
    margin-left: auto;
    width: 100%;
    max-width: 1400px;
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

    &__main-container {
        background: transparent !important;
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
    &__row-attribute {
        font-weight: 500;
        min-width: 230px;
    }
    &__row-value {
        margin-left: 1rem;
        &--hardcoded {
            color: #999;
        }
    }
    &__row-icon-btn {
        cursor: pointer;
        color: rgb(8, 29, 53);
        background-color: rgb(233, 236, 239);
        border: solid 1.25px rgb(233, 236, 239);
        height: 25px;
        width: 25px;
        border-radius: 6px;
        // center content with flex
        display: flex;
        justify-content: center;
        align-items: center;
    }
    &__separator {
        border: 1px solid #e0e0e0;
        margin: 1rem 0;
    }
}
</style>

