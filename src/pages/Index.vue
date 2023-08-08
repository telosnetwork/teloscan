<script>
import TransactionTable from 'components/TransactionTable';
import HomeInfo from 'components/HomeInfo.vue';
import { useMeta } from 'quasar';
export default {
    name: 'IndexPage',
    components: {
        HomeInfo,
        TransactionTable,
    },
    setup() {
        const title = 'Teloscan';
        const description = `TelosEVM ${process.env.NETWORK} explorer ${Date.now()}`;
        useMeta(() => ({
            title,
            meta: {
                description: { name: 'description', content: description },
                keywords: { name: 'keywords', content: description },
                ogTitle: { name: 'og:title', content: title },
                // eslint-disable-next-line max-len
                ogImage: { name: 'og:image', content: 'https://assets-global.website-files.com/60abb689ce5c94972a5f808a/649971b39fc28e4d6d988c84_Telos_Max%20tps_7b-p-800.jpg' },
            },
        }));
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
