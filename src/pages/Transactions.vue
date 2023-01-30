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
<q-page class="column justify-center items-center">
    <div class="row q-pa-lg">
        <div class="text-h4">{{ $t('pages.explore_transactions') }}</div>
    </div>
    <div class="row">
        <div class="col-12 q-px-sm">
            <TransactionTable title="$t('pages.recent_transactions')"/>
        </div>
    </div>
</q-page>
</template>
