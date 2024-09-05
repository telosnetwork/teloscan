<script>
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import AddressField from 'components/AddressField';
import ValueField from 'components/ValueField.vue';
import { getDirection } from 'src/lib/transaction-utils';
import { useChainStore } from 'src/antelope';

export default {
    name: 'InternalTransactionFlatTable',
    components: {
        TransactionField,
        AddressField,
        DateField,
        BlockField,
        ValueField,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
        page: {
            type: Number,
        },
        pagesize: {
            type: Number,
        },
        filter: {
            type: Object,
            default: () => ({}),
        },
        initialPageSize: {
            type: Number,
            default: 1,
        },
        usePagination: {
            type: Boolean,
            default: true,
        },
    },
    data() {
        const columns = [
            {
                name: 'hash',
                label: 'hash',
                align: 'left',
            },
            {
                name: 'block',
                label: 'block',
                align: 'left',
            },
            {
                name: 'date',
                label: 'date',
                align: 'left',
            },
            {
                name: 'type',
                label: 'type',
                align: 'left',
            },
            {
                name: 'from',
                label: 'from',
                align: 'left',
            },
            {
                name: 'direction',
                label: 'direction',
                align: 'left',
            },
            {
                name: 'to',
                label: 'to',
                align: 'left',
            },
            {
                name: 'value',
                label: 'value',
                align: 'right',
            },
        ];

        // this is a sample of the data that will be obtained from the new API
        const sampleData = {
            'code': 200,
            'success': true,
            'message': 'OK',
            'contracts': {},
            'results': [
                {
                    'blockHash': '0x195f9b576f76f70d270c31daf253fc6abadd27f85295b399951791a93de8d930',
                    'address': null,
                    'traceAddress': [6],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xd1267832099c93a38473a2d7c069ba1fb63ff4310cde8bfe033d0816efe237d2',
                    'result': { 'gasUsed': '0x02b85f' },
                    'transactionPosition': 0,
                    'blockNumber': 196929646,
                    'action': {
                        'input': '0x',
                        'gas': '0x0122e1',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '111',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0xde07825a46d9f9f59f8d339d7328723cdd1252a5958da925d929955fab1968a6',
                    'address': null,
                    'traceAddress': [5],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xef8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a2579',
                    'result': { 'gasUsed': '0x03c8e8' },
                    'transactionPosition': 0,
                    'blockNumber': 197640129,
                    'action': {
                        'input': '0x',
                        'gas': '0x0189a6',
                        'from': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'to': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'value': '1478185785293501154624',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0x298f9b676f76f70d270c31daf253fc6abadd27f85295b399951791a93de8d123',
                    'address': null,
                    'traceAddress': [7],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xef8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a2579',
                    'result': { 'gasUsed': '0x02b85f' },
                    'transactionPosition': 0,
                    'blockNumber': 198929646,
                    'action': {
                        'input': '0x',
                        'gas': '0x0222e1',
                        'from': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '250',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0xde07825a46d9f9f59f8d339d7328723cdd1252a5958da925d929955fab1111a7',
                    'address': null,
                    'traceAddress': [8],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xcf8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a6789',
                    'result': { 'gasUsed': '0x03c8e8' },
                    'transactionPosition': 0,
                    'blockNumber': 199640129,
                    'action': {
                        'input': '0x',
                        'gas': '0x0389a6',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '1478185785293501154000',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0x59f9b676f76f70d270c31daf253fc6abadd27f85295b399951791a93de8d1234',
                    'address': null,
                    'traceAddress': [9],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xcf8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a6789',
                    'result': { 'gasUsed': '0x02b85f' },
                    'transactionPosition': 0,
                    'blockNumber': 200929646,
                    'action': {
                        'input': '0x',
                        'gas': '0x0322e1',
                        'from': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'to': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'value': '300',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0xde07825a46d9f9f59f8d339d7328723cdd1252a5958da925d929955fab1968a6',
                    'address': null,
                    'traceAddress': [10],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xcf8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a6789',
                    'result': { 'gasUsed': '0x03c8e8' },
                    'transactionPosition': 0,
                    'blockNumber': 201640129,
                    'action': {
                        'input': '0x',
                        'gas': '0x0189a6',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '1478185785293501154200',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0x29f9b576f76f70d270c31daf253fc6abadd27f85295b399951791a93de8d9301',
                    'address': null,
                    'traceAddress': [11],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xd1267832099c93a38473a2d7c069ba1fb63ff4310cde8bfe033d0816efe237d5',
                    'result': { 'gasUsed': '0x02b85f' },
                    'transactionPosition': 0,
                    'blockNumber': 202929646,
                    'action': {
                        'input': '0x',
                        'gas': '0x0122e1',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '200',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0xde07825a46d9f9f59f8d339d7328723cdd1252a5958da925d929955fab1968a7',
                    'address': null,
                    'traceAddress': [12],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xef8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a2572',
                    'result': { 'gasUsed': '0x03c8e8' },
                    'transactionPosition': 0,
                    'blockNumber': 203640129,
                    'action': {
                        'input': '0x',
                        'gas': '0x0189a6',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '1478185785293501154300',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0x49f9b576f76f70d270c31daf253fc6abadd27f85295b399951791a93de8d9310',
                    'address': null,
                    'traceAddress': [13],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xef8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a2572',
                    'result': { 'gasUsed': '0x02b85f' },
                    'transactionPosition': 0,
                    'blockNumber': 204929646,
                    'action': {
                        'input': '0x',
                        'gas': '0x0322e1',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '400',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0xde07825a46d9f9f59f8d339d7328723cdd1252a5958da925d929955fab1968a8',
                    'address': null,
                    'traceAddress': [14],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0xef8777abf72d0e9d376d564bc1fa3a2155cac93cc52fef7e863cfc522b5a2572',
                    'result': { 'gasUsed': '0x03c8e8' },
                    'transactionPosition': 0,
                    'blockNumber': 205640129,
                    'action': {
                        'input': '0x',
                        'gas': '0x0189a6',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '1478185785293501154400',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
                {
                    'blockHash': '0x99f9b576f76f70d270c31daf253fc6abadd27f85295b399951791a93de8d9320',
                    'address': null,
                    'traceAddress': [15],
                    'type': 'call',
                    'error': null,
                    'transactionHash': '0x91267832099c93a38473a2d7c069ba1fb63ff4310cde8bfe033d0816efe237d7',
                    'result': { 'gasUsed': '0x02b85f' },
                    'transactionPosition': 0,
                    'blockNumber': 206929646,
                    'action': {
                        'input': '0x',
                        'gas': '0x0322e1',
                        'from': '0xf9678db1ce83f6f51e5df348e2cc842ca51efec1',
                        'to': '0xa30b5e3c8fee56c135aecb733cd708cc31a5657a',
                        'value': '500',
                        'callType': 'call',
                    },
                    'subtraces': 0,
                    'timestamp': 1722496536000,
                },
            ],
        };


        return {
            sampleData,
            rows: [],
            loadingRows: [],
            columns,
            transactions: [],
            pageSize: this.initialPageSize,
            loading: true,
            pagination: {
                sortBy: 'date',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
            page_size_options: [10, 20, 50],
            showDateAge: true,
            allExpanded: false,
        };
    },
    async created() {
        // initialization of the translated texts
        this.columns.filter(t => t.name === 'hash')[0].label = this.$t('components.tx_hash');
        this.columns.filter(t => t.name === 'block')[0].label = this.$t('components.block');
        this.columns.filter(t => t.name === 'date')[0].label = this.$t('components.age');
        this.columns.filter(t => t.name === 'type')[0].label = this.$t('components.approvals.type');
        this.columns.filter(t => t.name === 'from')[0].label = this.$t('pages.from');
        this.columns.filter(t => t.name === 'to')[0].label = this.$t('pages.to');
        this.columns.filter(t => t.name === 'value')[0].label = this.$t('pages.value');
        this.columns.filter(t => t.name === 'direction')[0].label = this.$t('components.direction');
        if (!this.usePagination) {
            this.pagination.rowsPerPage = 25;
        }
        this.updateLoadingRows();
    },
    watch: {
        '$route.query.page': {
            handler(_pag) {
                let pag = _pag;
                let page = 1;
                let size = this.page_size_options[0];

                // we also allow to pass a single number as the page number
                if (typeof pag === 'number') {
                    page = pag;
                } else if (typeof pag === 'string') {
                    // we also allow to pass a string of two numbers: 'page,rowsPerPage'
                    const [p, s] = pag.split(',');
                    page = p;
                    size = s;
                }

                this.setPagination(page, size);
            },
            immediate: true,
        },
    },
    methods: {
        getDirection: getDirection,
        updateLoadingRows() {
            this.loadingRows = [];
            for (var i = 1; i <= this.pagination.rowsPerPage; i++) {
                this.loadingRows.push(i);
            }
        },
        popstate(event) {
            const page = event.state.pagination.page;
            const size = event.state.pagination.size;
            this.setPagination(page, size);
        },
        setPagination(page, size) {
            if (page) {
                this.pagination.page = Number(page);
            }

            if (this.usePagination) {
                if (size) {
                    this.pagination.rowsPerPage = Number(size);
                }
            } else {
                this.pagination.rowsPerPage = 0;
            }

            this.updateLoadingRows();
            this.onRequest({
                pagination: this.pagination,
            });
        },
        async onPaginationChange(props) {
            const { page, rowsPerPage } = props.pagination;

            // we need to change the URL to keep the pagination state by changing the this.$route.query.page
            // with a string like 'page,rowsPerPage'
            this.$router.push({
                // taking care to preserve the current #hash anchor and the current query parameters
                hash: window.location.hash,
                query: {
                    ...this.$route.query,
                    page: `${page},${rowsPerPage}`,
                },
            });
        },
        async fetchInternalTransactions() {
            // we simulate waiting 2 seconds and return the example data from the sampleData variable
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(this.sampleData);
                }, 2000);
            });
        },
        async onRequest(props) {
            const chainSettings = useChainStore().currentChain.settings;
            this.loading = true;
            this.rows = [];
            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            const path = this.getPath(props);
            let result = await this.$indexerApi.get(path);
            if (this.total === null) {
                this.pagination.rowsNumber = result.results.length;
            }
            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            // Process the result data
            let processedTransactions = 0;
            let lastTransactionHash = '';
            const totalEntries = [];
            result.results.forEach((internalTrx) => {
                if (internalTrx.transactionHash !== lastTransactionHash) {
                    processedTransactions++;
                    lastTransactionHash = internalTrx.transactionHash;
                }
                const entry = {
                    trx: processedTransactions % 2 === 0 ? 'even' : 'odd',
                    hash: internalTrx.transactionHash,
                    blockNumber: internalTrx.blockNumber,
                    timestamp: internalTrx.timestamp,
                    type: internalTrx.action.callType,
                    from: internalTrx.action.from,
                    to: internalTrx.action.to,
                    value: internalTrx.action.value,
                    symbol: chainSettings.getSystemToken().symbol,
                    decimals: chainSettings.getSystemToken().decimals,
                };
                totalEntries.push(entry);

            });

            this.rows = totalEntries;

            if (this.usePagination) {
                this.pagination.rowsNumber = result.results.length;
            } else {
                this.rows = this.rows.slice(0, 25);
            }

            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path;
            const filter = Object.assign({}, this.filter ? this.filter : {});
            if (this.address) {
                path = `/address/${this.address}/internal`;
            } else {
                path = '/internal';
            }
            path += `?limit=${
                rowsPerPage === 0 ? 25 : rowsPerPage
            }`;

            if (filter.block) {
                path += `&block=${filter.block}`;
            }

            if (filter.hash) {
                path += `&hash=${filter.hash}`;
            }

            path += `&offset=${(page - 1) * rowsPerPage}`;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            path += '&includeAbi=1&full=1';

            path += (!this.pagination.rowsNumber) ? '&includePagination=true' : '';  // We only need the count once

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
    class="c-inttrx-flat__table"
    :rows="loading? loadingRows : rows"
    :row-key="row => row.hash"
    :columns="columns"
    :rows-per-page-options="page_size_options"
    @request="onPaginationChange"
>
    <template v-if="!usePagination" v-slot:bottom>
        <q-card-actions
            align="center"
            class="c-inttrx-flat__footer"
        >
            <router-link class="c-inttrx-flat__footer-container" :to="{ name: 'txsinternal', query: { a: address } }">
                <span class="c-inttrx-flat__footer-text"> {{ $t('pages.transactions.see_all_transactions') }} </span>
                <q-icon name="arrow_forward" class="c-inttrx-flat__footer-icon" />
            </router-link>
        </q-card-actions>
    </template>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <template v-if="col.name === 'date'" >
                    <div class="c-inttrx-flat__header-age u-flex--center-y" @click="toggleDateFormat">
                        <a>{{ showDateAge ? col.label: $t('components.date') }}</a>
                        <q-icon
                            class="info-icon"
                            name="far fa-question-circle"
                        >
                            <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                                {{ $t('components.click_to_change_format') }}
                            </q-tooltip>
                        </q-icon>
                    </div>
                </template>
                <div v-else>
                    {{ col.label }}
                </div>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <template v-if="loading">
            <q-tr>
                <q-td
                    v-for="i in (8)"
                    :key="i"
                >
                    <q-skeleton type="text" class="c-trx-overview__skeleton" />
                </q-td>
            </q-tr>
        </template>
        <template v-else>
            <q-tr :props="props" :class="props.row.trx">
                <q-td key="hash" :props="props">
                    <TransactionField :transaction-hash="props.row.hash" :useHighlight="true"/>
                </q-td>
                <q-td key="block" :props="props">
                    <BlockField :block="props.row.blockNumber"/>
                </q-td>
                <q-td key="date" :props="props">
                    <DateField :epoch="(props.row.timestamp / 1000)" :force-show-age="showDateAge"/>
                </q-td>
                <q-td key="type" :props="props">
                    {{ props.row.type }}
                </q-td>
                <q-td key="from" :props="props">
                    <AddressField
                        v-if="props.row.from"
                        :key="props.row.from"
                        :address="props.row.from"
                        :truncate="12"
                    />
                </q-td>
                <q-td key="direction" :props="props">
                    <span
                        :class="`direction ${getDirection(address, props.row)}`"
                    >
                        {{ $t(`components.transaction.${getDirection(address, props.row)}`).toUpperCase() }}
                    </span>
                </q-td>
                <q-td key="to" :props="props">
                    <AddressField
                        v-if="props.row.to"
                        :key="props.row.to"
                        :address="props.row.to"
                        :truncate="12"
                    />
                </q-td>
                <q-td key="value" :props="props">
                    <ValueField
                        :value="props.row.value"
                        :symbol="props.row.symbol"
                        :decimals="props.row.decimals"
                    />
                </q-td>
            </q-tr>
        </template>
    </template>
</q-table>
</template>
<style lang="scss">

.odd {
    background-color: var(--odd-row-bg-color);
}

.direction {
  @include direction;
}

.c-inttrx-flat {
    .info-icon{
        margin-left: .25rem;
        padding-bottom: 0.2rem;
    }



    &__table {
        .q-table__bottom {
            position: relative;
        }
    }
    &__header-age {
        gap: 5px;
    }
    &__footer {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        top: 0;
        cursor: pointer;
        display: flex;
        gap: 5px;
        background-color: color-mix(in srgb, white, black 5%);

        &-container {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 1;
        }

        body.body--dark & {
            background-color: color-mix(in srgb, $dark, white 5%);
        }

        &-text {
            font-size: 0.7rem;
            text-transform: uppercase;
        }
        &:hover {
            color: var(--q-primary);
        }
    }

}


</style>
