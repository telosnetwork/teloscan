<script>
import AddressField from 'components/AddressField';
import TokenValueField from 'components/Token/TokenValueField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';
import { getIcon } from 'src/lib/token-utils';
import { APPROVAL_SIGNATURES, ERC_APPROVAL_SIGNATURE } from 'src/lib/abi/signature/approval_signatures';

export default {
    name: 'ApprovalList',
    components: {
        AddressField,
        TokenValueField,
    },
    props: {
        logs: {
            type: Array,
            required: true,
        },
        expanded: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    methods: {
        formatWei,
        getIcon,
        async expand(){
            this.isExpanded = true;
            this.pApprovals = await this.loadApprovals();
        },
        async loadApprovals() {
            let approvals = [];
            for (const log of this.logs) {
                let sig = log.topics[0].substr(0, 10);
                if (APPROVAL_SIGNATURES.includes(sig)) {
                    let contract = await this.$contractManager.getContract(log.address);
                    if (!contract || contract.supportedInterfaces === null) {
                        continue;
                    }
                    if(approvals.length >= 10 && this.isExpanded === false){
                        this.more = true;
                        break;
                    }
                    let spender = '0x' + log.topics[2].substr(log.topics[2].length - 40, 40);
                    if (sig === ERC_APPROVAL_SIGNATURE) {
                        if(contract.supportedInterfaces.includes('erc20')){
                            approvals.push({
                                amount: BigNumber.from(log.data).toString(),
                                token: contract,
                                spender: spender,
                            });
                        } else if(contract.supportedInterfaces.includes('erc721')){
                            approvals.push({
                                tokenId: log.topics[3],
                                token: contract,
                                spender: spender,
                            });
                        }
                    } else {
                        approvals.push({
                            token: contract,
                            spender: spender,
                        });
                    }
                }

            }
            this.isLoading = false;
            return approvals;
        },
    },

    async mounted() {
        this.pApprovals = await this.loadApprovals();
    },
    data() {
        return {
            pApprovals: [],
            isExpanded: this.expanded,
            more: false,
            isLoading: true,
        };
    },
};
</script>

<template>
<div v-if="pApprovals?.length > 0" class="fit row wrap justify-start items-start content-start">
    <div  class="col-3">
        <strong>
            <span>{{ $t('components.approvals.approvals_granted_title') }}</span>
        </strong>
    </div>
    <div class="col-9 erc-approvals">
        <div
            v-for="(approval, index) in pApprovals"
            :key="'erca' + index"
            class="fit row wrap justify-start items-start content-start"
        >
            <div class="col-4 flex">
                <q-icon class="list-arrow" name="arrow_right" />
                <strong class="q-pr-sm">{{ $t('components.approvals.spender') }}</strong>
                <AddressField :address="approval.spender" :truncate="18" />
            </div>
            <div v-if="approval.amount" class="col-3 flex">
                <strong class="q-pr-sm">{{ $t('components.approvals.amount') }}</strong>
                <TokenValueField
                    :value="approval.amount"
                    :showWei="true"
                    :address="approval.token.address"
                    :truncate="6"
                />
            </div>
            <div v-else-if="approval.tokenId" class="col-3 flex">
                <strong class="q-pr-sm">{{ $t('components.token') }}</strong>
                <span>#{{ approval.tokenId }}</span>
                <AddressField :address="approval.token.address" :truncate="16" />
            </div>
            <div v-else class="col-3 flex">
                <strong class="q-pr-sm">{{ $t('components.token') }}</strong>
                <AddressField :address="approval.token.address" :truncate="16" />
                <small>(ALL)</small>
            </div>
        </div>
    </div>
</div>
<div v-if="isLoading" class="fit row wrap justify-center items-center q-mt-sm">
    <div class="col-3"></div>
    <div class="col-9 justify-center flex">
        <q-spinner size="1.5em" class="q-mr-xs"/>
        <span>{{ $t('pages.loading_transfers') }}</span>
    </div>
</div>
<br>
</template>

<!--eslint-enable-->
<style scoped lang="sass">
.body--dark .expand-btn
    color: rgba(255, 255, 255, 0.6)
.expand-btn
    position: relative
    margin-top: 4px
    cursor: pointer
    color: rgba(0, 0, 0, 0.6)
.body--dark .expand-btn .flex
    background: var(--q-dark)
.expand-btn .flex
    background: white
    padding-right: 5px
    z-index: 2
.erc-approvals
    .row
        .col-5
            strong
                margin-right: 3px

@media (max-width: 1024px)
    .row
        .col-3
            width: 100%
    .erc-approvals
        .row
            .col-3, .col-9, .col-5
                width: 100%
                padding-left: 0px
            .col-5
                padding-top: 2px
            .col-3, .col-5
                padding-left: 15px
            .col-4
                padding-top: 10px
                width: 100%
            .col-9
                padding-left: 10px
</style>
