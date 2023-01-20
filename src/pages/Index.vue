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

<template lang='pug'>
q-page.pageContainer
    .row.justify-center.q-py-lg
      .text-h4.text-primary.title.q-mt-xl.bold
        | {{ $t('pages.telos_evm_explorer') }}
    .row.q-pt-xl.q-pb-md.tableWrapper
      .col-12
        HomeInfo
    .row.tableWrapper
      .col-12.q-pb-lg
          q-card
            TransactionTable( title="$t('pages.recent_transactions')" )
</template>
