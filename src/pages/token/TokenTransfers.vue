<template>
<div class="c-token-transfers container">
    <div class="row">
        <div class="col-12">
            <q-table
                :pagination.sync="pagination"
                :data="transfers"
                :columns="columns"
                :loading="loading"
                flat
                @request="onRequest"
            >
                <q-tr slot="header">
                    <q-th
                        v-for="col in columns"
                        :key="col.label"
                        align="left"
                    >
                        {{ col.label }}
                    </q-th>
                </q-tr>

                <q-tr
                    slot="body"
                    slot-scope="props"
                    :props="props"
                >
                    <q-td key="transaction">
                        <transaction-field :transaction-hash="props.row.transaction" />
                    </q-td>
                    <q-td key="from">
                        <!-- eztodo isContract prop -->
                        <address-field :address="props.row.from" />
                    </q-td>
                    <q-td key="to">
                        <address-field :address="props.row.to" />
                    </q-td>
                    <q-td key="amount">
                        {{ props.row.amount }} TLOS
                    </q-td>
                </q-tr>
            </q-table>
        </div>
    </div>
</div>
</template>

<script>
import AddressField from 'components/AddressField';
import TransactionField from 'components/TransactionField';

const columns = [
    {
        name: 'transaction',
        label: 'Tx Hash',
        align: 'left',
    },
    {
        name: 'from',
        label: 'From',
        align: 'left',
    },
    {
        name: 'to',
        label: 'To',
        align: 'left',
    },
    {
        name: 'amount',
        label: 'Quantity',
        align: 'left',
    },

];

/*

/transfers?address=0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec&contract=0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD&limit=10&offset=20

{"contracts":{"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD":{"creator":"0x612DeeF3BDb1B2884949C0d6711Fb898dfd9E57B","address":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","block":201116631,"from_trace":false,"trace_address":"","transaction":"0x07a7ae963869d11bc010b0a3e715f02ad8ee0f949e27c8535142a69044eff2ee"}},"results":[{"amount":"25591365753725687364341651125","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0xe5c0faaa8b38653952a6a9317afcc68871203508","to":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","transaction":"0x0bdb9d3bcaff85256abf68c4b39212cb6e14a9a206bd092860661641667057fe"},{"amount":"7206559663351516158979419693","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x114e157d52e148ad93a3f711a086f6e58989da36","to":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","transaction":"0x5ee5133c86ac0b42a471bd7219893932b132aa7f82a2d42ce7130f957e592ebc"},{"amount":"6642453491193680576140815250","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","to":"0x612deef3bdb1b2884949c0d6711fb898dfd9e57b","transaction":"0x673a1f4b80b59ecc901395da95847be402308f21d4745a94b1ec778ebb0bc13a"},{"amount":"1606687127505777317483949210","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0xe5c0faaa8b38653952a6a9317afcc68871203508","to":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","transaction":"0x3933f5d85cb2e026b79ce178aac15613358f0e21ea4596421920e5b43087e0c5"},{"amount":"21095741431910972236706006174","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x9516b59d4d1fde9ffe4f7f4ecc37269205a97375","to":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","transaction":"0x35ca9268425c2f7ccaa454db748e5b3b73936c07506ca9c25e90865f639abb2b"},{"amount":"2775276502771619871380469476","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","to":"0x612deef3bdb1b2884949c0d6711fb898dfd9e57b","transaction":"0xfdbd23b27f0650eaa8dc5f5f08351d7a50a63bd4863daf307f0feec5deaa6704"},{"amount":"4128488780132986553575714975","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","to":"0x9516b59d4d1fde9ffe4f7f4ecc37269205a97375","transaction":"0x05136edaad4c797032024be8a69155240aa8cd676af2f58a24c7aa41fdd7f6c4"},{"amount":"0","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","to":"0x90dc72f60ab42abc80cb65522bde0d60c5296ecd","transaction":"0x05136edaad4c797032024be8a69155240aa8cd676af2f58a24c7aa41fdd7f6c4"},{"amount":"0","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","to":"0x90dc72f60ab42abc80cb65522bde0d60c5296ecd","transaction":"0x3389862fa464a36349c81c222f385076b31bdfb77197662135cfab19ae151f07"},{"amount":"6790522755917610088572233911","contract":"0x90dc72f60aB42abC80Cb65522BDE0d60C5296ecD","from":"0x22240d7dc7c4956ecaf26c4f70c856b0d2c7b1ec","to":"0x9516b59d4d1fde9ffe4f7f4ecc37269205a97375","transaction":"0x3389862fa464a36349c81c222f385076b31bdfb77197662135cfab19ae151f07"}]}

*/

export default {
    name: 'TokenTransfers',
    components: {
        AddressField,
        TransactionField,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data: () => ({
        columns,
        pagination: {
            page: 1,
            rowsPerPage: 50,
        },
        transfers: [],
        loading: true,
    }),
    created() {
        const params = {
            address: null,
            contract: this.address,
            limit: null,
            offset: null,
        };

        this.$teloscanApi.get('transfers', { params })
            .then(({ data }) => {
                this.transfers = data?.results ?? [];
            })
            .catch((err) => {
                console.error(`Unable to fetch token transfers for address ${this.address}:\n${err}`);
            })
            .finally(() => {
                this.loading = false;
            });
    },
    methods: {
        onRequest() {
            return;
        },
    },
}
</script>

<style>

</style>
