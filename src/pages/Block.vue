<script>
import TransactionTable from 'components/TransactionTable';
import DateField from 'components/DateField';

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
    mounted() {
        this.loadBlock();
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
                        {{ blockData.transactionsCount }}
                    </div>
                </div>
                <div class="dataCardItem">
                    <div class="dataCardTile">
                        <DateField :epoch="blockData.timestamp / 1000"/>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div v-if="!error" class="tableWrapper shadow-2 content-container q-mt-lg">
        <TransactionTable :title="block" :filter="`block/${block}`"/>
    </div>
    <div v-else class="bg-white q-pa-xl rounded-borders">
        <div class="flex">
            <q-icon name="warning" size="md" />
            <span class="q-pl-md text-h5">{{ error }}</span>
        </div>
        <div class="q-pt-md">
            {{ $t('global.async_error_description') }}
        </div>
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
