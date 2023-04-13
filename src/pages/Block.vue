<script>
import TransactionTable from 'components/TransactionTable';
import DateField from 'components/DateField';
import { mapActions } from 'vuex';

export default {
    name: 'BlockPage',
    components: { DateField, TransactionTable },
    data() {
        return {
            block: this.$route.params.block,
            blockData: null,
        };
    },
    mounted() {
        this.loadBlock();
    },
    watch: {
        '$route.params.block': {
            handler(newBlock) {
                const { block } = newBlock;
                if (this.block === block) {
                    return;
                }
                this.block = newBlock;
                this.loadBlock();
            },
            immediate: true,
        },
    },
    methods: {
        ...mapActions('evm', ['doRPC']),
        async loadBlock() {
            const blockResponse = await this.doRPC({
                method: 'eth_getBlockByNumber',
                params: [parseInt(this.block).toString(16), false],
            });
            this.blockData = blockResponse.result;
        },
        prevBlock() {
            this.$router.push({ name: 'block', params: { block: parseInt(this.block) - 1 } });
        },
        nextBlock() {
            this.$router.push({ name:'block', params: { block: parseInt(this.block) + 1 } });
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
                <div class="inline block-container__block-navigation">
                    <span class="inline text-white block-container__block-number">{{block}}</span>
                    <div class="block-container__block-navigation--box inline" @click="prevBlock">
                        <q-icon class="fas fa-arrow-left" size="8px"/>
                    </div>
                    <div class="block-container__block-navigation--box inline" @click="nextBlock">
                        <q-icon class="fas fa-arrow-right" size="8px"/>
                    </div>
                </div>
            </div>
            <div v-if="blockData" class="dataCardsContainer">
                <div class="dataCardItem">
                    <div class="dataCardTile">
                        {{ $t('pages.gas_used') }}
                    </div>
                    <div class="dataCardData">
                        {{ parseInt(blockData.gasUsed, 16) }}
                    </div>
                </div>
                <div class="dataCardItem">
                    <div class="dataCardTile">
                        {{ $t('pages.transactions') }}
                    </div>
                    <div class="dataCardData">
                        {{ blockData.transactions.length || 0 }}
                    </div>
                </div>
                <div class="dataCardItem">
                    <div class="dataCardTile">
                        <DateField :epoch="blockData.timestamp"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="tableWrapper shadow-2 content-container q-mt-lg">
        <TransactionTable :title="block" :filter="{block}"/>
    </div>
</div>
</template>

<style scoped lang="sass">
.inline
    display: inline-flex
    align-items: center
    justify-content: center

.block-container
    &__block-number
        font-size: 16px
        margin-right: 6px
    &__block-navigation
        height: 24px
        margin-top: 8px
        &--box
            height: 16px
            width: 16px
            margin: 0 2px 0 2px
            border: 1px solid $white
            border-radius: 2px
        .q-icon
.shadow-2
    box-shadow: none !important

@media only screen and (max-width: 1200px)
    .row.justify-between.q-mb-lg
        padding: 5px 15px
@media only screen and (max-width: 768px)
    .pageContainer
        background: linear-gradient(#252a5e 17.19%, #2d4684 65.83%, transparent 100%)
    .row.justify-between.q-mb-lg
        div
            &:first-child
                text-align: center
                width: 100%
    .dataCardsContainer
        width: 100%
        margin-top: 30px
</style>
