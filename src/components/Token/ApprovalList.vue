<script>
import AddressField from 'components/AddressField';
import DateField from 'components/DateField';
import { formatWei } from 'src/lib/utils';
import { mapGetters } from 'vuex';

export default {
    name: 'ApprovalList',
    components: { AddressField, DateField },
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data() {
        let columns = [
            {
                name: 'amount',
                label: this.$t('components.approvals.amount'),
                align: 'left',
                sortable: true,
            },
            {
                name: 'contract',
                label: this.$t('pages.contract'),
                align: 'left',
            },
            {
                name: 'spender',
                label: this.$t('components.approvals.spender'),
                align: 'left',
            },
            {
                name: 'updated',
                label: this.$t('global.updated'),
                align: 'left',
            },
            {
                name: 'action',
                label: this.$t('global.action'),
                align: 'left',
            },
        ];
        return {
            columns: columns,
            approvals: [],
            displayConfirmModal: false,
            pagination: {
                sortBy: 'amount',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
            removing: false,
            removal : { contract: null, spender: null },
            loading: true,
        };
    },
    async mounted() {
        await this.onRequest({
            pagination: this.pagination,
        });

    },

    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn', 'isNative']),
    },
    methods: {
        async onRequest(props){
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
            let approvals = [];
            for (let approval of response.data.results) {
                approval.removing = false;
                if(approval.amount > 0){
                    approval.amount = formatWei(
                        approval.amount,
                        approval.contract.properties?.decimals || 18,
                        4,
                    ).toString();
                }
                approvals.push(approval);
            }
            this.approvals = approvals;
            this.loading = false;

        },
        getPath(props){
            const { page, rowsPerPage, descending } = props.pagination;
            let path = `/account/${this.address}/approvals?limit=${
                rowsPerPage === 0 ? 10 : rowsPerPage
            }`;
            path += `&includeAbi=true&offset=${(page - 1) * rowsPerPage}`;
            path = (this.pagination.rowsNumber === 0) ? path + '&includePagination=true' : path;
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            return path;
        },
        async removeApproval() {
            let index = 0;
            for(let i = 0; i < this.approvals.length;i++){
                if(
                    this.approvals[i].contract === this.removal.contract
                    && this.approvals[i].spender === this.removal.spender
                ){
                    this.approvals[i].removing = true;
                    index = i;
                }
            }
            if(!this.removal.contract || !this.removal.spender){
                return;
            }
            this.removing = true;

            const provider = this.isLoggedIn && !this.isNative ?
                this.$providerManager.getEthersProvider().getSigner() :
                this.$contractManager.getEthersProvider();
            const contract  = await this.$contractManager.getContract(this.removal.contract);
            if(!contract){
                return;
            }
            const instance  = await this.$contractManager.getContractInstance(contract, provider);
            let success = false;
            try {
                let result = await instance.approve(this.removal.spender, 0);
                if(result?.hash){
                    this.displayConfirmModal = false;
                    this.$q.notify({
                        type: 'positive',
                        message: this.$t(
                            'components.approvals.removal_success',
                            { spender: this.removal.spender, contract: this.removal.contract },
                        ),
                    });
                    success = true;
                    await new Promise(resolve => setTimeout(resolve, 2500));
                    this.onRequest({
                        pagination: this.pagination,
                    });
                }
            } catch (e) {
                console.error(`Failed to remove approval: ${e}`);
                this.$q.notify({
                    type: 'negative',
                    message: this.$t('components.approvals.removal_failed', { e }),
                });
            }
            this.approvals[index].removing = false;
            this.removing = false;
            return success;
        },
        handleCtaClick(spender, contract) {
            if (!this.isLoggedIn) {
                this.displayLoginModal = true;
                return;
            }
            this.removal = {
                contract: contract,
                spender: spender,
            };
            this.displayConfirmModal = true;
        },
        formatWei,
        isLoggedIn(){
            return this.isLoggedIn();
        },
    },
};
</script>

<template>
<div :key="displayConfirmModal">
    <q-table
        v-model:pagination="pagination"
        :rows="approvals"
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
                <q-td key="amount" :props="props">
                    <span v-if="parseFloat(props.row.amount) > 100000000" key="amount100M" >
                        <span>> 100 millions</span>
                        <q-tooltip>{{ props.row.amount }}</q-tooltip>
                    </span>
                    <span v-else :key="props.row.amount">
                        {{ props.row.amount }}
                    </span>
                </q-td>
                <q-td key="contract" :props="props">
                    <AddressField :key="props.row.contract + 'c'" :address="props.row.contract" />
                </q-td>
                <q-td key="spender" :props="props">
                    <AddressField :key="props.row.spender + 'c'" :address="props.row.spender" />
                </q-td>
                <q-td key="updated" :props="props">
                    <DateField :epoch="props.row.updated / 1000" />
                </q-td>
                <q-td key="action" :props="props" @click="handleCtaClick(props.row.spender, props.row.contract)">
                    <span v-if="!props.row.removing && isLoggedIn">
                        <q-icon name="delete" size="xs" class="clickable" />
                        <q-tooltip>{{ $t('components.approvals.removal_approval') }}</q-tooltip>
                    </span>
                    <span v-else-if="props.row.removing">
                        <q-spinner size="sm" />
                        <q-tooltip>{{ $t('components.approvals.removal_in_progress') }}</q-tooltip>
                    </span>
                </q-td>
            </q-tr>
        </template>
    </q-table>
    <q-dialog v-model="displayConfirmModal">
        <q-card v-if="!removing">
            <q-card-section>
                <p>
                    {{ $t('components.approvals.removal_confirm') }}
                </p>
                <p>
                    {{ $t('components.approvals.removal_text' ) }}
                </p>
            </q-card-section>

            <q-card-actions align="right" class="q-pb-md q-px-md">
                <q-btn
                    v-close-popup
                    flat
                    :label="$t('components.approvals.cancel')"
                    color="negative"
                />
                <q-btn
                    v-close-popup
                    :label="$t('components.approvals.remove_approval')"
                    color="secondary"
                    text-color="black"
                    @click="removeApproval()"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</div>
</template>

<style scoped lang="sass">
    .sortable
        height: 60px
        display: flex
        align-items: center
</style>
