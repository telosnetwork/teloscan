<script>
import TransactionTable from 'components/TransactionTable';
import HomeInfo from 'components/HomeInfo.vue';
export default {
    name: 'IndexPage',
    components: {
        HomeInfo,
        TransactionTable,
    },
};
</script>

<template>
<q-page class="pageContainer">
    <div class="row justify-center q-py-lg">
        <div class="text-h4 text-primary title q-mt-xl bold">{{ $t('pages.telos_evm_explorer') }}</div>
    </div>
    <div class="row q-pt-xl q-pb-md tableWrapper">
        <div class="col-12">
            <HomeInfo/>
        </div>
    </div>
    <div class="row tableWrapper">
        <div class="col-12 q-pb-lg">
            <q-card>
                <TransactionTable title="$t('pages.recent_transactions')"/>
            </q-card>
        </div>
    </div>
</q-page>
</template>
