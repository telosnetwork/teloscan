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
    methods: {
        ...mapActions('evm', ['doRPC']),
        async loadBlock() {
            const blockResponse = await this.doRPC({
                method: 'eth_getBlockByNumber',
                params: [parseInt(this.block).toString(16), false],
            });
            this.blockData = blockResponse.result;
        },
    },
};
</script>
<template>
<div class="pageContainer q-pt-xl">
    <div>
        <div class="row justify-between q-mb-lg">
            <div>
                <div class="text-primary text-h4">
                    <div>Block</div>
                </div>
                <div class="text-white">
                    <div>{{block}}</div>
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
