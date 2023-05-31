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
            <div class="col-3 flex">
                <strong class="q-pr-sm">{{ $t('components.approvals.spender') }}</strong>
                <AddressField :address="approval.spender" :truncate="16" />
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
            </div>
        </div>
    </div>
</div>
</template>

<!--eslint-enable-->
<style scoped lang="sass">
</style>
