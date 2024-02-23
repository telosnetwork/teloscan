<script>
import TransactionTable from 'components/TransactionTable';

export default {
    name: 'TransactionsPage',
    components: {
        TransactionTable,
    },
};
</script>

<template>
<q-page class="c-index">
    <div class="row justify-center q-py-lg">
        <div class="text-h4 title q-mt-xl bold">{{ $t('pages.explore_transactions') }}</div>
    </div>
    <div class="row q-pt-xl q-pb-md tableWrapper">
        <div class="col-12">
            <HomeInfo/>
        </div>
    </div>
    <div class="row c-index__table">
        <div class="col-12 q-pb-lg">
            <q-card>
                <TransactionTable title="$t('pages.recent_transactions')"/>
            </q-card>
        </div>
    </div>
</q-page>
</template>
