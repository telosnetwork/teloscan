<script>
import AddressField from 'components/AddressField';
import TokenValueField from 'components/Token/TokenValueField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';
import BigDecimal from 'js-big-decimal';
import { getIcon } from 'src/lib/token-utils';
import { APPROVAL_SIGNATURES, ERC_APPROVAL_SIGNATURE } from 'src/lib/abi/signature/approval_signatures';

const INFINITE = BigNumber.from('115792089237316195423570985008687907853269984665640560039451964907916451577029');

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
        isInfiniteApproval(log, contract){
            let amount = BigNumber.from(log.data);
            let infinite = (amount.gte(INFINITE));
            if(!infinite && contract.properties?.supply){
                let fAmount = new BigDecimal(
                    formatWei(amount, contract.properties.decimals, contract.properties.decimals),
                );
                let supply = new BigDecimal(contract.properties.supply);
                infinite = (fAmount.compareTo(supply) > -1);
            }
            return infinite;
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
                            let infinite = this.isInfiniteApproval(log, contract);
                            approvals.push({
                                amount: BigNumber.from(log.data).toString(),
                                infinite: infinite,
                                token: contract,
                                spender: spender,
                            });
                        } else if(contract.supportedInterfaces.includes('erc721')){
                            approvals.push({
                                tokenId: BigNumber.from(log.topics[3]).toString(),
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
<div v-if="pApprovals?.length > 0" class="fit row wrap justify-start items-start content-start q-pb-md q-mb-xs">
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
                <strong class="q-pr-sm">{{ $t('components.approvals.spender') }} :</strong>
                <AddressField :address="approval.spender" :truncate="18" />
            </div>
            <div v-if="approval.amount && !approval.infinite" class="col-6 flex">
                <strong class="q-pr-sm">{{ $t('components.approvals.amount') }} :</strong>
                <TokenValueField
                    :value="approval.amount"
                    :showWei="true"
                    :address="approval.token.address"
                    :truncate="6"
                />
            </div>
            <div v-else-if="approval.amount && approval.infinite" class="col-6 flex items-center">
                <strong class="q-pr-sm">{{ $t('components.approvals.amount') }} : </strong>
                <span class="flex items-center">
                    <q-icon name="all_inclusive" class="q-mr-xs" />
                    <span class="q-mr-xs">{{ $t('components.approvals.infinite') }} </span>
                </span>
                <q-tooltip>{{ $t('components.approvals.infinite_tooltip') }}</q-tooltip>
                <span><AddressField :address="approval.token.address" :truncate="18" /></span>
            </div>
            <div v-else-if="approval.tokenId" class="col-6 flex">
                <strong class="q-pr-sm">{{ $t('components.token') }} :</strong>
                <AddressField :address="approval.token.address" :truncate="16" />
                <span class="q-pl-xs">#{{ approval.tokenId }}</span>
            </div>
            <div v-else class="col-6 flex items-center">
                <strong class="q-pr-sm">{{ $t('components.token') }} :</strong>
                <q-icon name="all_inclusive" class="q-mr-xs" />
                <AddressField :address="approval.token.address" :truncate="16" />
            </div>
        </div>
    </div>
</div>
<div v-else-if="isLoading" class="fit row wrap justify-center items-center q-mt-sm q-pb-md q-mb-xs">
    <div class="col-3"></div>
    <div class="col-9 justify-center flex">
        <q-spinner size="1.5em" class="q-mr-xs"/>
        <span>{{ $t('pages.loading_approvals') }}</span>
    </div>
</div>
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
