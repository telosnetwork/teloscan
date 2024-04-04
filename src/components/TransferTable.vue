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
                label: this.$t('components.age'),
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
            highlightAddress: '',
        };
    },
    created(){
        this.updateLoadingRows();
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
        truncatedId(id) {
            // only truncate if the id is longer than 7 characters
            // we need to show the first 4 and last 3 characters
            if (id.length > 7) {
                return id.substr(0, 4) + '...' + id.substr(id.length - 3);
            } else {
                return id;
            }
        },
        setHighlightAddress(address) {
            this.highlightAddress = address;
        },
        async updateLoadingRows() {
            this.loadingRows = [];
            for (var i = 1; i <= this.pagination.rowsPerPage; i++) {
                this.loadingRows.push(i);
            }
        },
        async onRequest(props) {
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;

            let response = await this.$indexerApi.get(this.getPath(props));
            if (this.total === null && response.data?.total_count) {
                this.pagination.rowsNumber = response.data.total_count;
            }

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;
            this.updateLoadingRows();

            let newTransfers = [];
            for (const transfer of response.data.results) {
                const contractData = response.data.contracts[transfer.contract];
                let valueDisplay;
                if(this.tokenType === 'erc20'){
                    if (contractData && contractData.decimals) {
                        valueDisplay = formatWei(transfer.amount, contractData.decimals);
                    } else {
                        valueDisplay = this.$t('components.unknown_precision');
                    }
                } else if (this.tokenType === 'erc721') {
                    valueDisplay = '#' + transfer.id.toString();
                } else if (this.tokenType === 'erc1155') {
                    valueDisplay = transfer.amount.toString();
                } else if(transfer.id) {
                    valueDisplay = '#' + transfer.id.toString();
                }

                const nTransfer = {
                    hash: transfer.transaction,
                    timestamp: transfer.timestamp,
                    count: transfer.amount,
                    id: transfer.id,
                    token: transfer.token,
                    value: valueDisplay,
                    contract: contractData,
                    from: toChecksumAddress(transfer.from),
                    to: toChecksumAddress(transfer.to),
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
        convertToEpoch(dateString){
            // date may be returned as date string or epoch depending on api call
            if (typeof dateString === 'number'){
                return dateString / 1000;
            }
            // convert YYYY-MM-DD hh:mm:ss format returned from api to unix epoch
            const d = dateString.split(/\D+/);
            const epoch = new Date(d[0], --d[1], d[1], d[3], d[4], d[5]) / 1000;
            return epoch;
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
    @request="onRequest"
>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
            >
                <div
                    v-if="col.name==='date'"
                    class="u-flex--center-y"
                    @click="toggleDateFormat"
                >
                    <a>{{ showDateAge ? col.label: $t('components.date') }}</a>

                    <q-icon
                        class="info-icon"
                        name="far fa-question-circle"
                    >
                        <q-tooltip anchor="bottom middle" self="bottom middle">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div v-else class="u-flex--center-y">
                    {{ col.label }}
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
                <DateField :epoch="convertToEpoch(props.row.timestamp)" :force-show-age="showDateAge"/>
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
                <AddressField
                    v-if="props.row.from"
                    :key="props.row.from"
                    :address="props.row.from"
                    :truncate="16"
                    :highlightAddress="highlightAddress"
                    @highlight="setHighlightAddress"
                />
            </q-td>
            <q-td key="to" :props="props">
                <AddressField
                    v-if="props.row.to"
                    :key="props.row.to"
                    :address="props.row.to"
                    :truncate="16"
                    :highlightAddress="highlightAddress"
                    @highlight="setHighlightAddress"
                />
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
                    :key="props.row.contract.address"
                    :address="props.row.contract.address"
                    :truncate="16"
                    :highlightAddress="highlightAddress"
                    @highlight="setHighlightAddress"
                />
                <span v-if="tokenType === 'erc1155'" class="q-pl-xs" >
                    #{{ truncatedId(props.row.id) }}
                    <q-tooltip>{{ props.row.id }}</q-tooltip>
                </span>
            </q-td>
        </q-tr>
    </template>
</q-table>
<q-table
    v-else
    v-model:pagination="pagination"
    :rows="loadingRows"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-label="$t('global.records_per_page')"
    :rows-per-page-options="[10, 20, 50]"
>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th
                v-for="col in props.cols"
                :key="col.name"
                :props="props"
            >
                <div
                    v-if="col.name==='date'"
                    class="u-flex--center-y"
                    @click="toggleDateFormat"
                >
                    <a>{{ showDateAge ? col.label: $t('components.date') }}</a>

                    <q-icon
                        class="info-icon"
                        name="far fa-question-circle"
                    >
                        <q-tooltip anchor="bottom middle" self="bottom middle">
                            {{ $t('components.click_to_change_format') }}
                        </q-tooltip>
                    </q-icon>
                </div>
                <div v-else class="u-flex--center-y">
                    {{ col.label }}
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
            <q-td key="token" >
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

.info-icon{
    margin-left: .25rem;
}

</style>
