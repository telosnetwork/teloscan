<script>
import TransactionTable from 'components/TransactionTable.vue';
import DateField from 'components/DateField.vue';

export default {
    name: 'BlockPage',
    components: { DateField, TransactionTable },
    data() {
        return {
            block: this.$route.params.block,
            blockData: null,
            error: false,
        };
    },
    async mounted() {
        await this.loadBlock();
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
                if (blockResponse) {
                    [this.blockData] = blockResponse.data.results;
                }
            } catch (e) {
                this.error = this.$t('components.failed_to_fetch_transactions');
                console.error(e);
            }
        },
        prevBlock() {
            this.resetBlockData();
            this.$router.push({ name: 'block', params: { block: Number(this.block) - 1 } });
        },
        nextBlock() {
            this.resetBlockData();
            this.$router.push({ name: 'block', params: { block: Number(this.block) + 1 } });
        },
        resetBlockData() {
            this.blockData = null;
        },
    },
};
</script>
<template>
<div class="pageContainer q-pt-xl">
    <div>
        <div class="row justify-between q-mb-lg">
            <div class="block-container">
                <div class="text-primary text-h4">
                    <div>Block</div>
                </div>
                <div class="block-container__block-navigation inline ">
                    <span class="block-container__block-number inline text-white">{{block}}</span>
                    <div class="block-container__block-navigation--box inline" @click="prevBlock">
                        <q-icon class="fas fa-arrow-left" size="8px"/>
                    </div>
                    <div class="block-container__block-navigation--box inline" @click="nextBlock">
                        <q-icon class="fas fa-arrow-right" size="8px"/>
                    </div>
                </div>
            </div>
            <div class="dataCardsContainer">
                <div v-if="blockData && blockData.transactionsCount > 0" class="dataCardItem" >
                    <div class="dataCardTile q-mt-sm">
                        {{ $t('pages.gas_used') }}
                    </div>
                    <div class="dataCardData">
                        {{ parseInt(blockData.gasUsed, 16) }}
                    </div>
                </div>
                <div v-if="blockData && blockData.transactionsCount > 0" class="dataCardItem">
                    <div class="dataCardTile q-mt-sm">
                        {{ $t('pages.transactions') }}
                    </div>
                    <div class="dataCardData">
                        {{ blockData.transactionsCount }}
                    </div>
                </div>
                <div v-if="blockData" class="dataCardItem time-stamp">
                    <DateField :epoch="parseInt(blockData.timestamp / 1000)"/>
                </div>
            </div>
        </div>
    </div>
    <div
        v-if="!error && blockData && blockData.transactionsCount > 0"
        class="tableWrapper shadow-2 content-container q-mt-lg"
    >
        <TransactionTable :title="block" :filter="`block/${block}`"/>
    </div>
    <div v-else-if="error" class="bg-white q-pa-xl rounded-borders">
        <div class="flex">
            <q-icon name="warning" size="md" />
            <span class="q-pl-md text-h5">{{ error }}</span>
        </div>
        <div class="q-pt-md">
            {{ $t('global.async_error_description') }}
        </div>
    </div>
    <div v-else class="bg-white q-pa-xl rounded-borders">
        <div class="flex">
            <q-icon name="data_array" size="md" />
            <span class="q-pl-md text-h5">{{ $t('global.empty_block') }}</span>
        </div>
        <div class="q-pt-md">
            {{ $t('global.empty_block_description') }}
        </div>
    </div>
</div>
</template>

<style scoped lang="sass">
.body--dark .bg-white
    background: $dark !important
.dataCardData
    height: 40px

.dataCardItem
    color: $white

.inline
    display: inline-flex
    align-items: center
    justify-content: center

.block-container
    &__block-number
        width: 100px
        font-size: 16px
        margin-right: 6px
        justify-content: start
    &__block-navigation
        height: 24px
        margin-top: 8px
        color: $white
        &--box
            height: 16px
            width: 16px
            margin: 0 2px 0 2px
            border: 1px solid $white
            border-radius: 2px
            cursor: pointer
.shadow-2
    box-shadow: none !important

@media only screen and (max-width: 1200px)
    .row.justify-between.q-mb-lg
        padding: 5px 15px
@media only screen and (max-width: 768px)
    .pageContainer
        background: linear-gradient(#252a5e 17.19%, #2d4684 65.83%, transparent 100%)
    .time-stamp
        text-align: center
        width: 100%
        min-height: 38px
    .dataCardsContainer
        width: 100%
        margin-top: 30px
</style>
