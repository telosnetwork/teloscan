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
        let list = await this.$contractManager.getSystemContractsList();
        for(const contract in list.contracts){
            this.systemContractsList += list.contracts[contract].address + ',';
        }
        this.systemContractsList.substr(this.systemContractsList.length -2, this.systemContractsList.length - 1);
        await this.onRequest({
            pagination: this.pagination,
        });
    },
    data() {
        let columns = [
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
                label: '% ' + this.$t('components.holders.telos_supply'),
                align: 'left',
            },
            {
                name: 'supply_share',
                label: '% ' + this.$t('components.holders.global_supply'),
                align: 'left',
            },
            {
                name: 'updated',
                label: this.$t('global.updated'),
                align: 'left',
            },
        ];
        if(!this.contract.properties?.total_supply_ibc){
            columns.splice(3, 1);
        }
        return {
            columns: columns,
            holders: [],
            loading: true,
            systemContractsList: '',
            showSystemContracts: false,
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
            if (response.data?.total_count && this.pagination.rowsNumber !== response.data?.total_count) {
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
            path += `&includeAbi=true&offset=${(page - 1) * rowsPerPage}`;
            path += '&includePagination=true';
            path = (!this.showSystemContracts) ? path + '&not=' + this.systemContractsList : path;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            return path;
        },
        formatWei,
        displaySupplyShare(balance, supplies, decimals, fixed){
            let share = ((parseFloat(balance) / parseFloat(supplies)) * 100);
            if(fixed){
                if(share < 0.01){
                    return '< 0.01%';
                }
                share = share.toFixed(fixed);
            }
            return share + '%';
        },
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
    <template v-slot:loading>
        <q-inner-loading showing color="primary" />
    </template>
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
                <AddressField :key="props.row.address + 'c'" :address="props.row.address" :truncate="18" />
            </q-td>
            <q-td key="balance" :props="props">
                <span v-if="contract.properties?.decimals">
                    {{ formatWei(props.row.balance, contract.properties?.decimals) }}
                </span>
                <span v-else>
                    {{ props.row.balance }}
                </span>
            </q-td>
            <q-td key="telos_supply_share" :props="props">
                <span v-if="contract?.properties?.supply">
                    <span>
                        {{ displaySupplyShare(
                            formatWei(
                                props.row.balance,
                                contract.properties?.decimals,
                                contract.properties?.decimals
                            ),
                            formatWei(
                                contract.properties.supply,
                                contract.properties?.decimals,
                                contract.properties?.decimals
                            ),
                            contract.properties?.decimals,
                            2,
                        )}}
                    </span>
                    <q-tooltip>
                        {{ displaySupplyShare(
                            formatWei(
                                props.row.balance,
                                contract.properties?.decimals,
                                contract.properties?.decimals
                            ),
                            formatWei(
                                contract.properties.supply,
                                contract.properties?.decimals,
                                contract.properties?.decimals
                            ),
                            contract.properties?.decimals,
                            false,
                        )}}
                    </q-tooltip>
                </span>
            </q-td>
            <q-td v-if="contract?.properties?.total_supply_ibc" key="supply_share" :props="props">
                <span>
                    <span>
                        {{ displaySupplyShare(
                            formatWei(
                                props.row.balance,
                                contract.properties?.decimals,
                                contract.properties?.decimals
                            ),
                            contract.properties?.total_supply_ibc,
                            contract.properties?.decimals,
                            2,
                        )}}
                    </span>
                    <q-tooltip>
                        {{ displaySupplyShare(
                            formatWei(
                                props.row.balance,
                                contract.properties?.decimals,
                                contract.properties?.decimals
                            ),
                            contract.properties?.total_supply_ibc,
                            contract.properties?.decimals,
                            false,
                        )}}
                    </q-tooltip>
                </span>
            </q-td>
            <q-td key="updated" :props="props">
                <DateField :epoch="props.row.updated / 1000" />
            </q-td>
        </q-tr>
    </template>
    <template v-if="holders.length > 0" v-slot:bottom-row>
        <q-toggle
            v-model="showSystemContracts"
            label="Show system contracts"
            color="secondary"
            checked-icon="visibility"
            unchecked-icon="visibility_off"
            @update:model-value="onRequest({pagination: pagination})"
        />
    </template>
</q-table>
</template>

<style scoped lang="sass">
.q-table .q-toggle
    font-size: 12px
    position: absolute
    bottom: 4px
.sortable
    height: 60px
    display: flex
    align-items: center

@media only screen and (max-width: 764px)
    .q-table .q-toggle
        display: none

</style>
