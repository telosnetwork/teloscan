<script>
import AddressField from 'components/AddressField';
import DateField from 'components/DateField';
import { formatWei } from 'src/lib/utils';
export default {
    name: 'HolderList',
    components: {
        AddressField,
        DateField,
    },
    props: {
        contract: {
            type: Object,
            required: true,
        },
    },
    async mounted() {
        await this.onRequest({
            pagination: this.pagination,
        });
    },
    data() {
        const columns = [
            {
                name: 'holder',
                label: this.$t('components.holders.holder'),
                align: 'left',
            },
            {
                name: 'balance',
                label: this.$t('components.holders.balance'),
                align: 'left',
                sortable: true,
            },
            {
                name: 'telos_supply_share',
                label: this.$t('components.holders.telos_share'),
                align: 'left',
            },
            {
                name: 'supply_share',
                label: this.$t('components.holders.global_share'),
                align: 'left',
            },
            {
                name: 'updated',
                label: this.$t('components.holders.updated'),
                align: 'left',
            },
        ];
        return {
            columns: columns,
            holders: [],
            loading: true,
            filterBy: this.filter,
            pagination: {
                sortBy: 'balance',
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
            let holders = [];
            for (let holder of response.data.results) {
                holders.push(holder);
            }
            this.holders = holders;
            this.loading = false;
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path = `/token/${this.contract.address}/holders?limit=${
                rowsPerPage === 0 ? 10 : rowsPerPage
            }`;
            path += `&offset=${(page - 1) * rowsPerPage}`;
            path = (this.pagination.rowsNumber === 0) ? path + '&includePagination=true' : path;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            return path;
        },
        formatWei,
    },
};
</script>

<template>
<q-table
    v-model:pagination="pagination"
    :rows="holders"
    :loading="loading"
    :binary-state-sort="true"
    :row-key="row => row.address"
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
            <q-td key="holder" :props="props">
                <AddressField :key="props.row.address + 'c'" :address="props.row.address" />
            </q-td>
            <q-td key="balance" :props="props">
                {{ formatWei(props.row.balance, contract.properties?.decimals || 18) }}
            </q-td>
            <q-td key="telos_supply_share" :props="props">
                <span v-if="contract.properties?.supply">
                    <span>
                        {{ ((props.row.balance / contract.properties.supply) * 100).toFixed(2) + '%'}}
                    </span>
                    <q-tooltip>
                        {{ ((props.row.balance / contract.properties.supply) * 100) + '%'}}
                    </q-tooltip>
                </span>
            </q-td>
            <q-td key="supply_share" :props="props">
                <span v-if="contract.properties?.total_supply_ibc">
                    <span>
                        {{ ((
                            formatWei(props.row.balance, contract.properties.decimals)
                            / contract.properties.total_supply_ibc
                        ) * 100).toFixed(2) + '%'}}
                    </span>
                    <q-tooltip>
                        {{ ((
                            formatWei(props.row.balance, contract.properties.decimals)
                            / contract.properties.total_supply_ibc
                        ) * 100) + '%'}}
                    </q-tooltip>
                </span>
            </q-td>
            <q-td key="updated" :props="props">
                <DateField :epoch="props.row.updated / 1000" />
            </q-td>
        </q-tr>
    </template>
</q-table>
</template>

<style scoped lang="sass">
.sortable
    height: 60px
    display: flex
    align-items: center
</style>
