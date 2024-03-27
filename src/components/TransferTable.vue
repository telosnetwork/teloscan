<script>
import AddressField from 'components/AddressField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import { formatWei, toChecksumAddress } from 'src/lib/utils';
import { getIcon } from 'src/lib/token-utils';

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
        const columns = [
            {
                name: 'hash',
                label: this.$t('components.tx_hash'),
                align: 'left',
            },
            {
                name: 'date',
                label: this.$t('components.date'),
                align: 'left',
            },
            {
                name: 'direction',
                label: '',
                align: 'left',
            },
            {
                name: 'from',
                label: this.$t('components.from'),
                align: 'left',
            },
            {
                name: 'to',
                label: this.$t('components.to'),
                align: 'left',
            },
            {
                name: 'value',
                label: this.$t('components.value'),
                align: 'left',
            },
            {
                name: 'token',
                label: this.$t('components.token'),
                align: 'left',
            },
        ];


        return {
            rows: [],
            loadingRows: [],
            columns,
            transfers: [],
            pageSize: this.initialPageSize,
            total: null,
            loading: true,
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
    created(){
        for (var i = 1; i <= this.pagination.rowsPerPage; i++) {
            this.loadingRows.push(i);
        }
    },
    mounted() {
        switch (this.tokenType) {
        case 'erc20':
            this.columns[5].label = this.$t('components.value');
            break;
        case 'erc721':
            this.columns[5].label = this.$t('components.nfts.id');
            break;
        case 'erc1155':
            this.columns[5].label = this.$t('components.nfts.amount');
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
                    valueDisplay = '#' + transfer.id.toString();
                    if(contract){
                        transfer.token = await this.$contractManager.loadNFT(contract, transfer.id);
                    }
                } else if (this.tokenType === 'erc1155') {
                    valueDisplay = transfer.amount.toString();
                } else if(transfer.id) {
                    valueDisplay = '#' + transfer.id.toString();
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
                    id: transfer.id,
                    token: transfer.token,
                    value: valueDisplay,
                    contract: contract,
                    from: toChecksumAddress(transfer.from),
                    to: toChecksumAddress(transfer.to),
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
        getIcon,
        toChecksumAddress,
    },
};
</script>

<template>
<q-table
    v-if="!loading"
    v-model:pagination="pagination"
    :rows="rows"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-label="$t('global.records_per_page')"
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
            <q-td key="direction" :props="props">
                <span v-if="toChecksumAddress(address) === toChecksumAddress(props.row.from)" class="direction out">
                    {{ $t('components.transaction.out').toUpperCase() }}
                </span>
                <span
                    v-else-if="toChecksumAddress(address) === toChecksumAddress(props.row.to)"
                    class="direction in"
                >
                    {{ $t('components.transaction.in').toUpperCase() }}
                </span>
            </q-td>
            <q-td key="from" :props="props">
                <AddressField :key="props.row.from" :address="props.row.from" :truncate="16"/>
            </q-td>
            <q-td key="to" :props="props">
                <AddressField :key="props.row.to" :address="props.row.to" :truncate="16"/>
            </q-td>
            <q-td key="value" :props="props">
                <span v-if="tokenType==='erc721' && props.row.token?.imageCache">
                    <q-img
                        class="nft-icon"
                        :src="props.row.token.imageCache + '/280.webp'"
                    />
                    <q-tooltip>{{ props.row.value }}</q-tooltip>
                </span>
                <span v-else-if="tokenType==='erc721' && props.row.value.length > 7">
                    <span>{{ props.row.value.substr(0, 7) + "..." }}</span>
                    <q-tooltip>{{ props.row.value }}</q-tooltip>
                </span>
                <span v-else>
                    {{ props.row.value }}
                </span>
            </q-td>
            <q-td key="token" :props="props" class="flex items-center">
                <AddressField
                    :key="props.row.contract"
                    class="token-name"
                    :address="props.row.address"
                    :contract="props.row.contract"
                    :truncate="15"
                />
                <span v-if="tokenType === 'erc1155'" class="q-pl-xs" >#{{ props.row.id}}</span>
            </q-td>
        </q-tr>
    </template>
</q-table>
<q-table
    v-else
    v-model:pagination="pagination"
    :rows="rows"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-label="$t('global.records_per_page')"
    :rows-per-page-options="[10, 20, 50]"
    flat
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

    <template v-slot:body="">
        <q-tr>
            <q-td key="hash" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="date" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="direction" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="from" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="to" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="value" >
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
            <q-td key="token"  class="flex items-center">
                <q-skeleton type="text" class="c-trx-overview__skeleton" />
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>

<style lang='scss' scoped>
.direction {
  user-select: none;
  padding: 3px 6px;
  border-radius: 5px;
  font-size: 0.9em;

  &.in {
    color: rgb(0, 161, 134);
    background: rgba(0, 161, 134, 0.1);
    border: 1px solid rgb(0, 161, 134);
  }

  &.out {
    color: #cc9a06 !important;
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid #cc9a06 !important;
  }
}

.nft-icon {
  width: 32px;
  height: 32px;
  vertical-align: middle;
  border-radius: 100%;
}

.coin-icon {
  width: 20px;
  height: 20px;
  margin-right: .25rem;
  vertical-align: middle;
  border-radius: 100%;
}

.token-name {
  vertical-align: middle;
  display: inline-block;
}

</style>
