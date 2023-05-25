<script>
import TokenValueField from 'components/Token/TokenValueField';
import AddressField from 'components/AddressField';
import BlockField from 'components/BlockField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import MethodField from 'components/MethodField';

export default {
    name: 'TransactionTable',
    components: {
        TransactionField,
        DateField,
        BlockField,
        AddressField,
        MethodField,
        TokenValueField,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        filter: {
            type: String,
            default: '',
        },
        address: {
            type: String,
            required: false,
        },
        initialPageSize: {
            type: Number,
            default: 1,
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
                name: 'block',
                label: this.$t('components.block'),
                align: 'left',
                sortable: true,
            },
            {
                name: 'date',
                label: this.$t('components.date'),
                align: 'left',
            },
            {
                name: 'method',
                label: this.$t('components.method'),
                align: 'left',
            },
        ];
        if(this.address){
            columns.push({
                name: 'direction',
                label: '',
                align: 'left',
            });
        }
        columns.push({
            name: 'from',
            label: this.$t('components.from'),
            align: 'left',
        });
        columns.push({
            name: 'to',
            label: this.$t('components.to_interacted_with'),
            align: 'left',
        });
        columns.push({
            name: 'value',
            label: this.$t('components.value_transfer'),
            align: 'left',
        });

        return {
            rows: [],
            columns,
            filterUpdated: false,
            transactions: [],
            pageSize: this.initialPageSize,
            total: null,
            loading: false,
            pagination: {
                sortBy: 'block',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
            page_size_options: [10, 20, 50],
            showDateAge: true,
        };
    },
    watch: {
        '$route.query.page': {
            handler(_pag) {
                let pag = _pag;
                let page = 1;
                let desc = true;
                let size = this.page_size_options[0];

                // we also allow to pass a single number as the page number
                if (typeof pag === 'number') {
                    page = pag;
                } else if (typeof pag === 'string') {
                    // we also allow to pass a string of two numbers: 'page,rowsPerPage'
                    const [p, s, d] = pag.split(',');
                    page = p;
                    size = s;
                    desc = (!d || d.toUpperCase() !== 'ASC');
                }

                this.setPagination(page, size, desc);
            },
            immediate: true,
        },
        filter: {
            async handler() {
                if (!this.filterUpdated) {
                    this.filterUpdated = true;
                    return;
                }
                await this.onRequest({ pagination: this.pagination });
            },
        },
    },
    methods: {
        setPagination(page, size, desc) {
            if (page) {
                this.pagination.page = Number(page);
            }
            if (size) {
                this.pagination.rowsPerPage = Number(size);
            }
            this.pagination.descending = Boolean(desc);
            this.onRequest({
                pagination: this.pagination,
            });
        },
        async onPaginationChange(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            // we need to change the URL to keep the pagination state by changing the this.$route.query.page
            // with a string like 'page,rowsPerPage'
            this.$router.push({
                // taking care to preserve the current #hash anchor and the current query parameters
                hash: window.location.hash,
                query: {
                    ...this.$route.query,
                    page: `${page},${rowsPerPage},${(descending) ? 'DESC' : 'ASC'}`,
                },
            });
        },
        async onRequest(props) {
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;
            let response = await this.$indexerApi.get(this.getPath(props));
            if (this.pagination.rowsNumber === 0) {
                this.pagination.rowsNumber = response.data?.total_count;
            }

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            this.transactions.splice(
                0,
                this.transactions.length,
                ...response.data.results,
            );
            this.rows = this.transactions;
            for (const transaction of this.transactions) {
                try {
                    if (transaction.input === '0x') {
                        continue;
                    }
                    if(!transaction.to) {
                        continue;
                    }

                    const contract = await this.$contractManager.getContract(
                        transaction.to,
                    );

                    if (!contract) {
                        continue;
                    }

                    const parsedTransaction = await this.$contractManager.parseContractTransaction(
                        transaction, transaction.input, contract, true,
                    );
                    if (parsedTransaction) {
                        transaction.parsedTransaction = parsedTransaction;
                    }
                    transaction.contract = contract;
                } catch (e) {
                    console.error(
                        `Failed to parse data for transaction, error was: ${e.message}`,
                    );
                    // notifiy user
                    this.$q.notify({
                        message: this.$t('components.failed_to_parse_transaction', { message: e.message }),
                        color: 'negative',
                        position: 'top',
                        timeout: 5000,
                    });
                }
            }
            this.rows = this.transactions;
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            const filter =  (this.filter.toString().length > 0) ? this.filter.toString() : '';
            let path = `${filter}/transactions?limit=${
                rowsPerPage === 0 ? 500 : rowsPerPage
            }`;
            path += `&offset=${(page - 1) * rowsPerPage}`;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            path += (this.pagination.rowsNumber === 0) ? '&includePagination=true' : '';  // We only need the count once
            path += '&includeAbi=true';
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
    :binary-state-sort="true"
    :rows-per-page-label="$t('global.records_per_page')"
    :row-key="row => row.hash"
    :columns="columns"
    :loading="loading"
    :rows-per-page-options="page_size_options"
    flat
    @request="onPaginationChange"
>
    <template v-slot:loading>
        <q-inner-loading showing color="secondary" />
    </template>
    <template v-slot:header="props">
        <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props">
                <div class="u-flex--center-y">
                    {{ col.label }}
                    <template v-if="col.name === 'date'">
                        <q-icon
                            class="info-icon"
                            name="fas fa-info-circle"
                            @click="toggleDateFormat"
                        >
                            <q-tooltip anchor="bottom middle" self="bottom middle" :offset="[0, 36]">
                                {{ $t('components.click_to_change_format') }}
                            </q-tooltip>
                        </q-icon>
                    </template>
                    <template v-if="col.name === 'method'">
                        <q-icon class="info-icon" name="fas fa-info-circle" />
                        <q-tooltip anchor="bottom middle" self="top middle" max-width="10rem">
                            {{ $t('components.executed_based_on_decoded_data') }}
                        </q-tooltip>
                    </template>
                </div>
            </q-th>
        </q-tr>
    </template>
    <template v-slot:body="props">
        <q-tr :key="props.row.hash + props.row.parsedTransaction?.transfers?.length" :props="props">
            <q-td key="hash" :props="props">
                <div class="flex items-center">
                    <q-icon
                        v-if="props.row.status !== '0x1'"
                        class="q-mr-xs"
                        name="warning"
                        color="negative"
                    />
                    <TransactionField
                        :color="(props.row.status !== '0x1') ? 'negative' : 'secondary'"
                        :transaction-hash="props.row.hash"
                        :truncate="(props.row.status !== '0x1') ? 18 : 20"
                    />
                </div>
            </q-td>
            <q-td key="block" :props="props">
                <BlockField :block="props.row.blockNumber"/>
            </q-td>
            <q-td key="date" :props="props">
                <DateField :epoch="props.row.timestamp / 1000" :force-show-age="showDateAge"/>
            </q-td>
            <q-td key="method" :props="props">
                <MethodField :trx="props.row" :shortenName="true"/>
            </q-td>
            <q-td v-if="address" key="direction" :props="props">
                <span v-if="address === props.row.from" class="direction out">
                    {{ $t('components.transaction.out').toUpperCase() }}
                </span>
                <span v-else-if="address === props.row.to" class="direction in">
                    {{ $t('components.transaction.in').toUpperCase() }}
                </span>
            </q-td>
            <q-td key="from" :props="props">
                <AddressField
                    v-if="props.row.from"
                    :key="props.row.from"
                    :address="props.row.from"
                    :truncate="18"
                />
            </q-td>
            <q-td key="to" :props="props">
                <AddressField
                    v-if="props.row.to"
                    :address="props.row.to"
                    :truncate="18"
                />
            </q-td>
            <q-td key='value' :props="props">
                <TokenValueField
                    v-if="props.row.parsedTransaction?.transfers?.length > 0"
                    :value="props.row.parsedTransaction.transfers[0].value.toString(16) || '0.0'"
                    :address="props.row.to"
                />
                <TokenValueField v-else :value="BigInt(props.row.value).toString(10) || '0.0'" />
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>
<!--eslint-enable-->
<style scoped lang="sass">
    .direction
        user-select: none
        padding: 3px 6px
        border-radius: 5px
        font-size: 0.9em
    .direction.in
        color: rgb(0,161,134)
        background: rgba(0,161,134,0.1)
        border: 1px solid rgb(0,161,134)
    .direction.out
        color: #cc9a06!important
        background: rgba(255,193,7,0.1)
        border: 1px solid #cc9a06!important
    .sortable
        height: 60px
        display: flex
        align-items: center
</style>

