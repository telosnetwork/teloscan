<script>
import TransactionTable from 'components/TransactionTable';
export default {
    name: 'TransactionsPage',
    components: {
        TransactionTable,
    },
};
</script>

<template lang='pug'>
q-page.column.justify-center.items-center
    .row.q-pa-lg
      .text-h4 {{ $t('pages.explore_transactions') }}
    .row
      .col-12.q-px-sm
        TransactionTable( :title="$t('pages.recent_transactions')")
</template>
