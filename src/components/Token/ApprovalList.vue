<script>
import AddressField from 'components/AddressField';
import DateField from 'components/DateField';
import { formatWei } from 'src/lib/utils';
import { mapGetters } from 'vuex';
import { erc721Abi } from 'src/lib/abi';
import erc20Abi from 'erc-20-abi';
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
                name: 'spender',
                label: this.$t('components.approvals.spender'),
                align: 'left',
            },
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
                name: 'type',
                label: this.$t('components.approvals.type'),
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
            confirmModal: null,
            approvals: [],
            selected: [],
            displayConfirmModal: false,
            displayUpdateModal: false,
            modalUpdateValue: false,
            pagination: {
                sortBy: 'amount',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
            removing: false,
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
        getProvider(){
            return  this.isLoggedIn && !this.isNative ?
                this.$providerManager.getEthersProvider().getSigner() :
                this.$contractManager.getEthersProvider();
        },
        async onRequest(props){
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;

            let response = await this.$indexerApi.get(this.getPath(props));

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;
            this.pagination.rowsNumber = response.data.total_count;
            let approvals = [];
            for (let approval of response.data.results) {
                approval.removing = false;
                approval.selected = (this.selected.includes(approval.spender + ':' + approval.contract));
                approval.contract = await this.$contractManager.getContract(approval.contract);
                if(approval.amount > 0){
                    approval.amountRaw = approval.amount;
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
            path += '&includePagination=true';
            path += `&sort=${descending ? 'desc' : 'asc'}`;
            return path;
        },
        async updateApproval(spender, contractAddress, amount) {
            if(!contractAddress || !spender){
                return;
            }
            this.removing = true;

            const contract  = await this.$contractManager.getContract(contractAddress);
            if(!contract){
                return;
            }
            const instance  = await this.$contractManager.getContractInstance(
                { address: contractAddress, abi: (contract.isNonFungible()) ? erc721Abi : erc20Abi },
                this.getProvider(),
            );
            let success = false;
            try {
                let result = await instance.approve(spender, amount);
                if(result?.hash){
                    success = true;
                }
            } catch (e) {
                console.error(`Failed to remove approval: ${e}`);
                this.$q.notify({
                    type: 'negative',
                    message: this.$t('components.approvals.removal_failed', { e }),
                });
            }
            this.removing = false;
            return success;
        },
        async handleCtaClick(spender, contract) {
            if (!this.isLoggedIn) {
                this.displayLoginModal = true;
                return;
            }
            this.displayConfirmModal = true;
            const ctx = this;
            this.confirmModal = async function () {
                let index = 0;
                for(let i = 0; i < this.approvals.length;i++){
                    if(
                        this.approvals[i].contract.address === contract
                        && this.approvals[i].spender === spender
                    ){
                        this.approvals[i].removing = true;
                        index = i;
                    }
                }
                this.approvals[index].removing = false;
                if(await ctx.updateApproval(spender, contract, 0)){
                    let approval = true;
                    let i = 0;
                    while(approval) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await this.onRequest({
                            pagination: this.pagination,
                        });
                        if(
                            this.approvals[index].contract.address !== contract
                            || this.approvals[index].spender !== spender
                        ){
                            approval = false;
                            break;
                        } else if(i > 9){
                            approval = false;
                            break;
                        }
                        i++;
                    }
                    this.$q.notify({
                        type: 'positive',
                        message: this.$t(
                            'components.approvals.removal_success',
                            { spender: spender, contract: contract },
                        ),
                    });
                    this.displayConfirmModal = false;
                }
            };
        },
        toggleAll(value){
            for(let i = 0; i < this.approvals.length; i++){
                this.toggleSelected(
                    this.approvals[i].spender + ':' +
                    (this.approvals[i].contract.address || this.approvals[i].contract),
                    value,
                );
            }
        },
        toggleSelected(id, value){
            let parts = id.split(':');
            for(let i = 0; i < this.approvals.length; i++){
                if(parts[0] === this.approvals[i].spender && parts[1] === this.approvals[i].contract.address){
                    if(this.approvals[i].selected){
                        console.log(this.approvals[i]);
                    }
                    this.approvals[i].selected = value;
                }
            }

            let index = this.selected.indexOf(id);
            if(value && index === -1){
                this.selected.push(id);
            } else if (index > - 1 && (this.selected.length === 1 || index === 0)) {
                this.selected = [];
            } else if (index > -1) {
                this.selected = this.selected.slice(index, 1);
            }
        },
        async handleCtaRemoveAll(){
            if (!this.isLoggedIn) {
                this.displayLoginModal = true;
                return;
            }
            let more = true;
            let limit = 100;
            let offset = 0;
            while(more){
                let response = await this.$indexerApi.get(
                    `/account/${this.address}/approvals?limit=${limit}&offset=${offset}&includePagination=true`,
                );
                more = response.data?.more || false;
                offset = offset + limit;
                if(response.data){
                    for(let approval of response.data.results){
                        this.toggleSelected(approval.spender + ':' + approval.contract, true);
                    }
                }
            }
            this.displayConfirmModal = true;
            const ctx = this;
            this.confirmModal = async function () {
                for(let selected in this.selected){
                    let parts = this.selected[selected].split(':');
                    await ctx.updateApproval(parts[0], parts[1], 0);
                }
                this.selected = [];
            };
        },
        async handleCtaRemoveSelected(){
            if (!this.isLoggedIn) {
                this.displayLoginModal = true;
                return;
            }
            this.displayConfirmModal = true;
            const ctx = this;
            this.confirmModal = async function () {
                for(let selected in ctx.selected){
                    let parts = ctx.selected[selected].split(':');
                    if(await ctx.updateApproval(parts[0], parts[1], 0)){
                        console.log('HE');
                    }
                }
                this.displayConfirmModal = false;
            };
        },
        async handleCtaUpdate(spender, contract, current){
            this.displayUpdateModal = true;
            this.modalUpdateValue = current;
            let ctx = this;
            this.confirmModalUpdate = async function(){
                let success = await this.updateApproval(spender, contract, ctx.modalUpdateValue);
                this.displayUpdateModal = false;
                return success;
            };
        },
        isLoggedIn(){
            return this.isLoggedIn();
        },
        formatWei,
    },
};
</script>

<template>
<div>
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
                <q-td key="spender" :props="props">
                    <AddressField :key="props.row.spender + 'c'" :address="props.row.spender" truncate="18" />
                </q-td>
                <q-td key="amount" :props="props" class="flex items-center">
                    <span v-if="parseFloat(props.row.amount) > props.row.contract.properties?.supply" key="infinite" >
                        <span>{{ $t('components.approvals.infinite') }}</span>
                    </span>
                    <span v-else :key="props.row.amount">
                        <span>{{ props.row.amount }}</span>
                        <q-tooltip>
                            {{ formatWei(props.row.amountRaw, props.row.contract?.properties?.decimals || 18) }}
                        </q-tooltip>
                    </span>
                    <q-icon
                        name="build"
                        size="11px"
                        class="q-ml-sm clickable"
                        @click="handleCtaUpdate (props.row.spender, props.row.contract.address, props.row.amountRaw)"
                    />
                </q-td>
                <q-td key="contract" :props="props">
                    <AddressField
                        :key="props.row.contract.address + 'contract'"
                        :address="props.row.contract.address"
                        :truncate="18"
                    />
                </q-td>
                <q-td key="type" :props="props">
                    <span
                        v-if="props.row.contract && props.row.contract.isNonFungible()"
                        class="label bg-secondary text-white q-pa-sm rounded"
                    >
                        ERC721
                    </span>
                    <span v-else class="label bg-positive text-white q-px-md q-py-sm rounded-borders">
                        ERC20
                    </span>
                </q-td>
                <q-td key="updated" :props="props">
                    <DateField :epoch="props.row.updated / 1000" />
                </q-td>
                <q-td
                    key="action"
                    :props="props"
                    @click="handleCtaClick(props.row.spender, props.row.contract.address)"
                >
                    <q-checkbox
                        v-model="selected"
                        :val="props.row.spender + ':' + props.row.contract.address"
                        :true-val="props.row.spender + ':' + props.row.contract.address"
                        color="secondary"
                        size="xs"
                    />
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
        <template v-slot:bottom-row>
            <q-tr class="text-right">
                <q-td colspan="12">
                    <div class="flex justify-end">
                        <div v-if="selected.length > 0" class="flex justify-end">
                            <div>
                                <q-btn class="items-center q-mr-sm" color="secondary" @click="toggleAll(false)">
                                    <q-icon
                                        name="highlight_off"
                                        class="q-mr-xs"
                                        size="14px"
                                    />
                                    <span>UNSELECT ALL</span>
                                </q-btn>
                                <q-tooltip>
                                    {{ $t('components.approvals.unselect_all_approvals') }}
                                </q-tooltip>
                            </div>
                            <div>
                                <q-btn class="items-center q-mr-sm" color="negative" @click="handleCtaRemoveSelected">
                                    <q-icon
                                        v-if="!removing"
                                        name="delete"
                                        class="q-mr-xs"
                                        size="14px"
                                    />
                                    <q-spinner v-else size="14px" />
                                    <span>DELETE {{ selected.length }}</span>
                                </q-btn>
                                <q-tooltip>{{ $t('components.approvals.removal_selected_approvals') }}</q-tooltip>
                            </div>
                        </div>
                        <div v-else>
                            <q-btn class="items-center q-mr-sm" color="negative" @click="handleCtaRemoveAll">
                                <q-icon
                                    v-if="!removing"
                                    name="delete"
                                    class="q-mr-xs"
                                    size="14px"
                                />
                                <q-spinner v-else size="14px" />
                                <span>DELETE ALL</span>
                            </q-btn>
                            <q-tooltip>{{ $t('components.approvals.removal_approvals') }}</q-tooltip>
                        </div>
                    </div>
                </q-td>
            </q-tr>
        </template>
    </q-table>
    <q-dialog v-model="displayUpdateModal">
        <q-card class="q-pa-xl">
            <q-card-section>
                <p class="text-h5">{{ $t('components.approvals.update') }}</p>
                <q-input v-model="modalUpdateValue" type="number" :value="modalUpdateValue" />
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
                    :label="$t('components.approvals.update')"
                    color="secondary"
                    text-color="black"
                    @click="confirmModalUpdate()"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
    <q-dialog v-model="displayConfirmModal">
        <q-card v-if="!removing">
            <q-card-section>
                <p class="text-h5">
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
                    @click="confirmModal()"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</div>
</template>

<style scoped lang="sass">
    .body--dark .q-checkbox__bg
        border-color: lightgray
    .q-card
        min-width: 320px
        flex-grow: 1
    .sortable
        height: 60px
        display: flex
        align-items: center
</style>
