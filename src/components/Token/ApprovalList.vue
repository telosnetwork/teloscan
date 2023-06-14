<script>
import AddressField from 'components/AddressField';
import DateField from 'components/DateField';
import { formatWei } from 'src/lib/utils';
import { mapGetters } from 'vuex';
import { erc721Abi } from 'src/lib/abi';
import erc20Abi from 'erc-20-abi';
import { BigNumber, ethers } from 'ethers';

export default {
    name: 'ApprovalList',
    components: { AddressField, DateField },
    props: {
        accountAddress: {
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
            mask: '##################',
            pagination: {
                sortBy: 'amount',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
            signing: false,
            loading: true,
        };
    },
    async mounted() {
        await this.onRequest({
            pagination: this.pagination,
        });
        if (!this.isLoggedIn) {
            this.displayLoginModal = true;
        }
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
                approval.selected = (this.selected.includes(approval.spender + ':' + approval.contract));
                approval.contract = await this.$contractManager.getContract(approval.contract);
                approval.usd = 0;
                if(approval.contract.properties?.price){
                    approval.usd = (formatWei(
                        approval.amount,
                        approval.contract.properties.decimals,
                    ) * approval.contract.properties?.price).toFixed(2);
                }
                if(approval.amount > 0){
                    approval.amountRaw = formatWei(
                        approval.amount,
                        approval.contract.properties?.decimals || 18,
                        approval.contract.properties?.decimals || 18,
                    );
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
            let path = `/account/${this.accountAddress}/approvals?limit=${
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
            this.signing = true;
            const contract  = await this.$contractManager.getContract(contractAddress);
            if(!contract){
                return;
            }
            const instance  = await this.$contractManager.getContractInstance(
                { address: contractAddress, abi: (contract.isNonFungible()) ? erc721Abi : erc20Abi },
                this.getProvider(),
            );
            let success = false;
            let err = this.$t('components.approvals.update_failed');
            try {
                let result = await instance.approve(spender, amount);
                if(result?.hash){
                    success = true;
                    const spenderContract  = await this.$contractManager.getContract(spender);
                    let ctx = this;
                    setTimeout(function () {
                        ctx.$q.notify({
                            type: 'positive',
                            message: ctx.$t(
                                'components.approvals.update_success',
                                {
                                    spender: spenderContract?.getName() || spender,
                                    contract: contract.getName() || contract.address,
                                },
                            ),
                        });
                    }, 2000);
                    return success;
                }
            } catch (e) {
                console.error(`Failed to remove approval: ${e}`);
                if(e.message){
                    err = e.message.split('(')[0];
                    err = err[0].toUpperCase() + err.slice(1, err.length - 1);
                }
            }
            this.$q.notify({
                type: 'negative',
                message: err,
            });
            return success;
        },
        async handleCtaClick(spender, contract) {
            if (!this.isLoggedInAccount()) {
                this.displayLoginModal = true;
                return;
            }
            this.displayConfirmModal = true;
            const ctx = this;
            this.confirmModal = async function () {
                const result = await ctx.updateApproval(spender, contract, 0);
                if(result){
                    await ctx.checkChanges();
                }
                this.signing = false;
                this.displayConfirmModal = false;
            };
        },
        async checkChanges(){
            let approval = true;
            let i = 0;
            let currentApprovals = this.approvals;
            await new Promise(resolve => setTimeout(resolve, 2000));
            while(approval) {
                await this.onRequest({
                    pagination: this.pagination,
                });
                for(let k = 0; k < currentApprovals.length; k++){
                    if(
                        !this.approvals[k]
                        || currentApprovals[k].amount !== this.approvals[k].amount
                        || currentApprovals[k].spender !== this.approvals[k].spender
                        || currentApprovals[k].contract !== this.approvals[k].contract
                    ){
                        approval = false;
                        break;
                    }
                }
                if(i === 5){
                    approval  = false;
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
                i++;
            }
            this.displayConfirmModal = false;
            this.displayUpdateModal = false;
            this.signing = false;
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
        async isLoggedInAccount(){
            if(!this.isLoggedIn){
                return false;
            }
            return (this.accountAddress === this.address);
        },
        async handleCtaRemoveAll(){
            if (!this.isLoggedInAccount()) {
                this.displayLoginModal = true;
                return;
            }
            let more = true;
            let limit = 100;
            let offset = 0;
            while(more){
                let response = await this.$indexerApi.get(
                    `/account/${this.accountAddress}/approvals?limit=${limit}&offset=${offset}&includePagination=true`,
                );
                more = response.data?.more || false;
                offset = offset + limit;
                if(response.data){
                    for(let approval of response.data.results){
                        this.toggleSelected(approval.spender + ':' + approval.contract, true);
                    }
                }
            }
            this.handleCtaRemoveSelected();
        },
        async handleCtaRemoveSelected(){
            if (!this.isLoggedIn) {
                this.displayLoginModal = true;
                return;
            }
            this.displayConfirmModal = true;
            const ctx = this;
            this.confirmModal = async function () {
                let results = [];
                await Promise.all(
                    ctx.selected.map(async (id) => {
                        let parts = id.split(':');
                        let result = await ctx.updateApproval(parts[0], parts[1], 0);
                        if(result){
                            results.push(true);
                        }
                    }),
                );
                if(results.includes(true)){
                    await ctx.checkChanges();
                }
                this.signing = false;
                this.displayConfirmModal = false;
            };
        },
        async handleCtaUpdate(spender, contractAddress, current){
            this.displayUpdateModal = true;
            this.modalUpdateValue = current;
            const contract  = await this.$contractManager.getContract(contractAddress);
            this.mask = '#'.repeat(contract.properties?.decimals || 18);
            this.confirmModalUpdate = async function(){
                let success = await this.updateApproval(
                    spender,
                    contractAddress,
                    BigNumber.from(ethers.utils.parseUnits(this.modalUpdateValue, contract.properties.decimals)),
                );
                if(success){
                    await this.checkChanges();
                }
                this.displayUpdateModal = false;
                this.signing = false;
                return success;
            };
        },
        modalHide(){
            this.signing = false;
            this.displayConfirmModal = false;
            this.displayUpdateModal = false;
        },
        formatWei,
    },
};
</script>

<template>
<div v-if="!isLoggedInAccount">
    <p>{{ $t('components.approvals.login_account') }}</p>
</div>
<div>
    <q-table
        v-model:pagination="pagination"
        :rows="approvals"
        :loading="loading"
        :rows-per-page-label="$t('global.records_per_page')"
        :binary-state-sort="true"
        :row-key="row => row.address"
        :columns="columns"
        :rows-per-page-options="[10, 20, 50]"
        flat
        @request="onRequest"
    >
        <template v-slot:loading>
            <q-inner-loading showing color="secondary" />
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
                <q-td key="spender" :props="props">
                    <AddressField :key="props.row.spender + 'c'" :address="props.row.spender" :truncate="18" />
                </q-td>
                <q-td key="amount" :props="props" >
                    <div class="flex items-center">
                        <span v-if="parseFloat(props.row.amount)>props.row.contract.properties?.supply" key="infinite">
                            <q-icon name="all_inclusive" class="q-mr-xs" />
                            <span>{{ $t('components.approvals.infinite') }}</span>
                            <q-tooltip>{{ $t('components.approvals.infinite_tooltip') }}</q-tooltip>
                        </span>
                        <span v-else :key="props.row.amount">
                            <span v-if="parseFloat(props.row.amountRaw) > 0.0001" >{{ props.row.amount }}</span>
                            <span v-else >{{ '< 0.0001' }}</span>
                            <q-tooltip v-if="parseFloat(props.row.amountRaw) > parseFloat(props.row.amount)">
                                {{ props.row.amountRaw }}
                            </q-tooltip>
                        </span>
                        <span class="flex items-center">
                            <q-icon
                                name="build"
                                size="11px"
                                class="q-ml-xs clickable"
                                @click="handleCtaUpdate(
                                    props.row.spender,
                                    props.row.contract.address,
                                    props.row.amountRaw
                                )"
                            />
                            <q-tooltip>{{ $t('components.approvals.update') }}</q-tooltip>
                        </span>
                    </div>
                    <div >
                        <small
                            v-if="
                                parseFloat(props.row.amount)<=props.row.contract.properties?.supply
                                    && props.row.usd > 0
                            "
                            class="text-grey"
                        >
                            ~{{ props.row.usd }} $
                        </small>
                    </div>
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
                        <span>ERC721</span>
                        <q-tooltip>{{ $t('global.erc721_token') }}</q-tooltip>
                    </span>
                    <span v-else class="label bg-positive text-white q-px-md q-py-sm rounded-borders">
                        <span>ERC20</span>
                        <q-tooltip>{{ $t('global.erc20_token') }}</q-tooltip>
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
                    <span>
                        <q-checkbox
                            v-model="selected"
                            :val="props.row.spender + ':' + props.row.contract.address"
                            :true-val="props.row.spender + ':' + props.row.contract.address"
                            color="secondary"
                            size="xs"
                        />
                        <q-tooltip v-if="selected.includes(props.row.spender + ':' + props.row.contract.address)">
                            {{ $t('components.approvals.unselect') }}
                        </q-tooltip>
                        <q-tooltip v-else>{{ $t('components.approvals.select') }}</q-tooltip>
                    </span>
                    <span v-if="isLoggedIn">
                        <q-icon name="delete" size="xs" class="clickable" />
                        <q-tooltip>{{ $t('components.approvals.removal_approval') }}</q-tooltip>
                    </span>
                </q-td>
            </q-tr>
        </template>
        <template v-if="approvals.length > 0" v-slot:bottom-row>
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
                                    <span>{{ $t('components.approvals.unselect_all').toUpperCase() }}</span>
                                </q-btn>
                                <q-tooltip>
                                    {{ $t('components.approvals.unselect_all') }}
                                </q-tooltip>
                            </div>
                            <div>
                                <q-btn
                                    class="items-center q-mr-sm"
                                    color="negative"
                                    @click="handleCtaRemoveSelected"
                                >
                                    <q-icon
                                        v-if="!signing"
                                        name="delete"
                                        class="q-mr-xs"
                                        size="14px"
                                    />
                                    <q-spinner v-else size="14px" class="q-mr-xs" />
                                    <span>
                                        {{ $t('components.approvals.delete').toUpperCase() }} {{ selected.length }}
                                    </span>
                                </q-btn>
                                <q-tooltip>{{ $t('components.approvals.removal_selected_approvals') }}</q-tooltip>
                            </div>
                        </div>
                        <div v-else>
                            <q-btn
                                class="items-center q-mr-sm"
                                color="negative"
                                @click="handleCtaRemoveAll"
                            >
                                <q-icon
                                    v-if="!signing"
                                    name="delete"
                                    class="q-mr-xs"
                                    size="14px"
                                />
                                <q-spinner v-else size="14px" class="q-mr-xs" />
                                <span>{{ $t('components.approvals.delete_all').toUpperCase() }}</span>
                            </q-btn>
                            <q-tooltip>{{ $t('components.approvals.removal_approvals') }}</q-tooltip>
                        </div>
                    </div>
                </q-td>
            </q-tr>
        </template>
    </q-table>
    <q-dialog v-model="displayUpdateModal" @hide="modalHide">
        <q-card v-if="!signing" class="q-pa-xl">
            <q-card-section>
                <p class="text-h5">{{ $t('components.approvals.update') }}</p>
                <p class="text-grey">{{ $t('components.approvals.update_description') }}</p>
                <q-input
                    ref="input"
                    v-model="modalUpdateValue"
                    type="number"
                    for="updateBtn"
                    :mask="'#.' + mask"
                    :value="modalUpdateValue"
                    :rules="[
                        val => (val.split('.')[1]?.length <= mask.length) || val.indexOf('.') === -1
                            || $t('global.max_decimals_reached', {max: mask.length})
                    ]"
                />
            </q-card-section>
            <q-card-actions align="right" class="q-pb-md q-px-md">
                <q-btn
                    v-close-popup
                    flat
                    :label="$t('components.approvals.cancel')"
                    color="negative"
                />
                <q-btn
                    id="updateBtn"
                    :disabled="!modalUpdateValue"
                    :label="$t('global.sign')"
                    color="secondary"
                    text-color="black"
                    @click="this.$refs.input.validate() && confirmModalUpdate()"
                />
            </q-card-actions>
        </q-card>
        <q-card v-else>
            <q-card-section class="items-center flex justify-center column">
                <div class="text-h5 text-center">{{ $t('global.wallet_response') }}...</div>
                <q-spinner size="xl" class="q-mt-lg" />
            </q-card-section>
        </q-card>
    </q-dialog>
    <q-dialog v-model="displayConfirmModal" @hide="modalHide">
        <q-card v-if="!signing">
            <q-card-section>
                <p class="text-h5">
                    {{ $t('components.approvals.update') }}
                </p>
                <p>
                    {{ $t('components.approvals.approval_text' ) }}
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
                    :label="$t('global.sign')"
                    color="secondary"
                    text-color="black"
                    @click="confirmModal()"
                />
            </q-card-actions>
        </q-card>
        <q-card v-else>
            <q-card-section class="items-center flex justify-center column">
                <div class="text-h5 text-center">{{ $t('global.wallet_response') }}...</div>
                <q-spinner size="xl" class="q-mt-lg" />
            </q-card-section>
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