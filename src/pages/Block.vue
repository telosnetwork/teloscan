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

<template lang="pug">
.pageContainer.q-pt-xl
    div
      .row.justify-between.q-mb-lg
        div
          .text-primary.text-h4
            div Block
          .text-white
            div {{block}}
        .dataCardsContainer(v-if="blockData")
          .dataCardItem
            .dataCardTile {{ $t('pages.gas_used') }}
            .dataCardData {{ parseInt(blockData.gasUsed, 16) }}
          .dataCardItem
            .dataCardTile {{ $t('pages.transactions') }}
            .dataCardData {{ blockData.transactions.length || 0 }}
          .dataCardItem
            .dataCardTile
              date-field( :epoch="blockData.timestamp" )
    .tableWrapper.shadow-2.content-container.q-mt-lg
      transaction-table( :title="block" :filter="{block}" )
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
