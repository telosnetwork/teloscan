<script>
import AddressField from 'components/AddressField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import DEFAULT_TOKEN_LOGO from 'src/assets/evm_logo.png';
import { formatWei } from 'src/lib/utils';

export default {
    name: 'TransferTable',
    components: {
        TransactionField,
        DateField,
        AddressField,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        tokenType: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        initialPageSize: {
            type: Number,
            required: true,
        },
    },
    data() {
        // TODO: Add icon column and render it
        const columns = [
            {
                name: 'hash',
                label: '',
                align: 'left',
            },
            {
                name: 'date',
                label: '',
                align: 'left',
            },
            {
                name: 'from',
                label: '',
                align: 'left',
            },
            {
                name: 'to',
                label: '',
                align: 'left',
            },
            {
                name: 'value',
                label: '',
                align: 'left',
            }, {
                name: 'token',
                label: '',
                align: 'left',
            },
        ];


        return {
            rows: [],
            columns,
            transfers: [],
            pageSize: this.initialPageSize,
            total: null,
            loading: false,
            expectedTopicLength: 0,
            pagination: {
                sortBy: 'date',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
            showDateAge: true,
            tokenList: {},
        };
    },
    async created() {
        // initialization of the translated texts
        this.columns[0].label = this.$t('components.tx_hash');
        this.columns[1].label = this.$t('components.date');
        this.columns[2].label = this.$t('components.from');
        this.columns[3].label = this.$t('components.to');
        this.columns[4].label = this.$t('components.value');
        this.columns[5].label = this.$t('components.token');
    },
    mounted() {
        switch (this.tokenType) {
        case 'erc20':
            break;
        case 'erc721':
            break;
        case 'erc1155':
            break;
        default:
            throw new Error(this.$t('components.unsupported_token_type', { tokenType: this.tokenType }));
        }

        this.onRequest({
            pagination: this.pagination,
        });
    },
    methods: {
        async onRequest(props) {
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;

            let response = await this.$indexerApi.get(this.getPath(props));
            if (this.total === null && response.data?.total_count) {
                this.pagination.rowsNumber = response.data.total_count;
            }

            const tokenList = await this.$contractManager.getTokenList();

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            let newTransfers = [];
            for (const transfer of response.data.results) {
                let contract = await this.$contractManager.getContract(transfer.contract);
                let valueDisplay;
                if(this.tokenType === 'erc20'){
                    if (contract && contract.properties.decimals) {
                        valueDisplay = formatWei(transfer.amount, contract.properties.decimals);
                    } else {
                        valueDisplay = this.$t('components.unknown_precision');
                    }
                } else if (this.tokenType === 'erc721') {
                    valueDisplay = '#' + transfer.id;
                }
                tokenList.tokens.forEach((token) => {
                    if(token.address.toLowerCase() === transfer.contract.toLowerCase()){
                        contract.logoURI = token.logoURI;
                    }
                });
                const nTransfer = {
                    hash: transfer.transaction,
                    timestamp: transfer.timestamp / 1000,
                    count: 1,
                    value: valueDisplay,
                    contract: contract,
                    from: transfer.from,
                    to: transfer.to,
                    ...contract,
                };

                newTransfers.push(nTransfer);
            }

            this.transfers.splice(
                0,
                this.transfers.length,
                ...newTransfers,
            );

            this.rows = this.transfers;
            this.loading = false;
        },
        getIcon(row) {
            if (row.logoURI) {
                if (row.logoURI.startsWith('ipfs://')) {
                    return row.logoURI.replace(/ipfs:\/\//, 'https://ipfs.io/ipfs/');
                }
                return row.logoURI;
            } else {
                return DEFAULT_TOKEN_LOGO;
            }
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path = `/account/${this.address}/transfers?limit=${
                rowsPerPage === 0 ? 10 : rowsPerPage
            }`;
            path += `&type=${this.tokenType}`;
            path += `&offset=${(page - 1) * rowsPerPage}&includePagination=true`;
            path += `&sort=${descending ? 'desc' : 'asc'}`;

            return path;
        },
        toggleDateFormat() {
            this.showDateAge = !this.showDateAge;
        },
    },
};
</script>

<template>
<q-table
    v-model:pagination="pagination"
    :rows="rows"
    :row-key="row => row.hash"
    :columns="columns"
    :loading="loading"
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

                    <q-icon
                        v-if="col.name==='date'"
                        class="info-icon"
                        name="fas fa-info-circle"
                        @click="toggleDateFormat"
                    >
                        <q-tooltip anchor="bottom middle" self="bottom middle">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </q-icon>
                </div>

            </q-th>
        </q-tr>
    </template>

    <template v-slot:body="props">
        <q-tr :props="props">
            <q-td key="hash" :props="props">
                <TransactionField :transaction-hash="props.row.hash"/>
            </q-td>
            <q-td key="date" :props="props">
                <DateField :epoch="props.row.timestamp" :force-show-age="showDateAge" />
            </q-td>
            <q-td key="from" :props="props">
                <AddressField :address="props.row.from"/>
            </q-td>
            <q-td key="to" :props="props">
                <AddressField :address="props.row.to"/>
            </q-td>
            <q-td key="value" :props="props">
                {{ props.row.value }}
            </q-td>
            <q-td key="token" :props="props">
                <q-img v-if="tokenType==='erc20'" class="coin-icon" :src="getIcon(props.row)"/>
                <AddressField
                    class="token-name"
                    :address="props.row.address"
                    :name="props.row.name"
                    :truncate="15"
                />
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>

<style lang='sass' scoped>
.coin-icon
  width: 20px
  margin-right: .25rem
  vertical-align: middle
  border-radius: 100%

.token-name
  vertical-align: middle
  display: inline-block
</style>
