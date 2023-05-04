<script>
import AddressField from 'components/AddressField';
import CustomTooltip from 'components/CustomTooltip';
export default {
    name: 'NFTList',
    props: {
        contract: {
            type: Object,
            required: false,
        },
    },
    components: {
        AddressField,
        CustomTooltip,
    },

    async created() {
        // initialization of the translated texts
        this.columns[0].label = this.$t('components.token_id');
        this.columns[1].label = this.$t('components.nfts.owner');
        this.columns[2].label = this.$t('components.nfts.minter');
        this.columns[3].label = this.$t('components.nfts.name');
        this.columns[4].label = this.$t('components.nfts.attributes')[0].toUpperCase() +
            this.$t('components.nfts.attributes').slice(1)
        ;
        this.columns[5].label = this.$t('components.nfts.image');
        this.columns[6].label = this.$t('components.nfts.metadata');
    },
    async mounted() {
        await this.onRequest({
            pagination: this.pagination,
        });
    },
    data() {
        const columns = [
            {
                name: 'token_id',
                label: '',
                align: 'left',
            },
            {
                name: 'owner',
                label: '',
                align: 'left',
            },
            {
                name: 'minter',
                label: '',
                align: 'left',
            },
            {
                name: 'name',
                label: '',
                align: 'left',
            },
            {
                name: 'attributes',
                label: '',
                align: 'left',
            },
            {
                name: 'image',
                label: '',
                align: 'left',
            },
            {
                name: 'metadata',
                label: '',
                align: 'center',
            },
        ];
        return {
            columns: columns,
            loading: true,
            nfts: [],
            pagination: {
                sortBy: 'token_id',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
        };
    },
    methods: {
        async onRequest(props) {
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;

            let response = await this.$indexerApi.get(this.getPath(props));

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;
            if (this.pagination.rowsNumber === 0 && response.data?.total_count) {
                this.pagination.rowsNumber = response.data.total_count;
            }
            this.nfts = [];
            for (const nft of response.data.results) {
                nft.metadata = (nft.metadata) ? JSON.parse(nft.metadata) : nft.metadata;
                if(nft.metadata?.attributes){
                    nft.metadata.attributesStr = '';
                    for(let i = 0; i < nft.metadata.attributes.length; i++){
                        nft.metadata.attributesStr +=
                            nft.metadata.attributes[i]['trait_type'] + ' : ' +
                            nft.metadata.attributes[i]['value'] + '\n'
                        ;
                    }
                }
                nft.tokenUri = nft.tokenUri.replace('ipfs://', 'https://ipfs.io/ipfs/');
                this.nfts.push(nft);
            }
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path = `/contract/${this.contract.address}/nfts?limit=${
                rowsPerPage === 0 ? 10 : rowsPerPage
            }`;
            path += `&offset=${(page - 1) * rowsPerPage}`;
            path = (this.pagination.rowsNumber === 0) ? path + '&includePagination=true' : path;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            return path;
        },
    },
};
</script>

<template>
<div>
    <q-table
        v-if="nfts.length > 0"
        v-model:pagination="pagination"
        :rows="nfts"
        :loading="loading"
        :row-key="row => row.tokenId"
        :columns="columns"
        :rows-per-page-options="[10, 20, 50]"
        flat
        @request="onRequest"
    >
        <template v-slot:header="props">
            <q-tr :props="props">
                <q-th
                    v-for="col in props.cols"
                    :key="col.name"
                    :props="props"
                >
                    <div class="u-flex--center-y">
                        {{ col.label }}
                    </div>
                </q-th>
            </q-tr>
        </template>
        <template v-slot:body="props">
            <q-tr :props="props">
                <q-td key="token_id" :props="props">
                    {{ props.row.tokenId }}
                </q-td>
                <q-td key="owner" :props="props">
                    <AddressField :address="props.row.owner" :truncate="22" />
                </q-td>
                <q-td key="minter" :props="props">
                    <AddressField :address="props.row.minter" :truncate="22" />
                </q-td>
                <q-td key="name" :props="props">
                    {{ props.row.metadata?.name }}
                </q-td>
                <q-td key="attributes" :props="props">
                    <div v-if="props.row.metadata?.attributes" class="flex items-center">
                        <q-icon name="list" size="xs" />
                        <span>{{ props.row.metadata.attributes.length }}</span>
                        <CustomTooltip
                            :content="props.row.metadata.attributesStr"
                            :long="true"
                        />
                    </div>
                </q-td>
                <q-td v-if="props.row.imageCache" key="image" :props="props">
                    <a
                        clickable="clickable"
                        :href="props.row.imageCache + '/1440.webp'"
                        target="_blank"
                    >
                        <q-img :src="props.row.imageCache + '/280.webp'" />
                    </a>
                    <q-tooltip v-if="props.row.metadata.attributes.length">
                        {{ $t('components.nfts.consult_media') }}
                    </q-tooltip>
                </q-td>
                <q-td key="metadata" :props="props">
                    <a
                        v-if="props.row.tokenUri"
                        clickable="clickable"
                        :href="props.row.tokenUri"
                        target="_blank"
                    >
                        <q-icon name="download" size="sm" />
                    </a>
                    <q-tooltip v-if="props.row.tokenUri">{{ $t('components.nfts.ipfs') }}</q-tooltip>
                </q-td>
            </q-tr>
        </template>
    </q-table>
</div>
</template>

<!--eslint-enable-->
<style scoped lang="sass">

</style>
