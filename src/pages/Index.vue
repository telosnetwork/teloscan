<script>
import Search from 'components/Search';
import TransactionTable from 'components/TransactionTable';
import HomeInfo from 'components/HomeInfo.vue';
export default {
    name: 'IndexPage',
    components: {
        Search,
        HomeInfo,
        TransactionTable,
    },
};
</script>

<template lang='pug'>
q-page.pageContainer
    .row.justify-center.q-py-lg
      .text-h4.text-primary.title.q-mt-xl.bold
        | {{ $t('telos_evm_explorer') }}
    .row.q-pt-xl.q-pb-md.tableWrapper
      .col-12
        HomeInfo
    .row.tableWrapper
      .col-12.q-pb-lg
          q-card
            Search.q-mx-md.q-px-md
            q-separator(color="blue-9")
            TransactionTable( title="$t('pages.recent_transactions')" )
</template>
