<script>
import AddressField from 'components/AddressField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';
import { getIcon } from 'src/lib/token-utils';
import CustomTooltip  from 'components/CustomTooltip';
import TokenValueField from 'components/TokenValueField';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';

export default {
    name: 'ERCTransfersList',
    components: {
        AddressField,
        CustomTooltip,
        TokenValueField,
    },
    props: {
        logs: {
            type: Array,
            required: true,
        },
        type: {
            type: String,
            required: false,
            default: 'erc20',
        },
        trxFrom: {
            type: String,
            required: false,
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
        parseTransfer(transfer){
            if(transfer.token?.metadata && transfer.token.metadata !== '"___INVALID_METADATA___"'){
                transfer.metadata = JSON.parse(transfer.token.metadata);
                Object.keys(transfer.metadata).forEach((key) => {
                    if(['image', 'attributes', 'name', 'description'].includes(key) === false){
                        delete transfer.metadata[key];
                    }
                });
            }
            return transfer;
        },
        async expand(){
            this.isExpanded = true;
            this.pTransfers = await this.loadTransfers();
        },
        async loadTransfers() {
            let transfers = [];
            for (const log of this.logs) {
                let sig = log.topics[0].substr(0, 10);
                if (TRANSFER_SIGNATURES.includes(sig)) {
                    let contract = await this.$contractManager.getContract(log.address);
                    if(!contract || contract.supportedInterfaces === null){
                        continue;
                    }
                    if(transfers.length >= 10 && this.isExpanded === false){
                        if (
                            this.type === 'erc721' && contract.supportedInterfaces.includes('erc721') ||
                            this.type === 'erc1155' && contract.supportedInterfaces.includes('erc1155') ||
                            this.type === 'erc20' && contract.supportedInterfaces.includes('erc20')
                        ) {
                            this.more = true;
                        }
                        break;
                    }
                    if (this.type === 'erc721' && contract.supportedInterfaces.includes('erc721')) {
                        let tokenId = BigNumber.from(log.topics[3]).toString();
                        this.isLoading = true;
                        let token = await this.$contractManager.loadNFT(contract, tokenId.toString());
                        let tokenUri = null;
                        if(token){
                            tokenUri = token.tokenUri?.replace('ipfs://', 'https://ipfs.io/ipfs/');
                        } else {
                            token = contract;
                        }
                        transfers.push({
                            'tokenId': tokenId,
                            'to': '0x' + log.topics[2].substr(log.topics[2].length - 40, 40),
                            'from': '0x' + log.topics[1].substr(log.topics[1].length - 40, 40),
                            'token' : token,
                            'contract' : contract,
                            'tokenUri': tokenUri,
                        });
                    } else if (this.type === 'erc1155' && contract.supportedInterfaces.includes('erc1155')) {
                        let tokenId = BigNumber.from(log.data.substr(0, 66)).toString();
                        this.isLoading = true;
                        let token = this.$contractManager.loadNFT(contract, tokenId.toString());
                        if(!token){
                            token = contract;
                        }
                        transfers.push({
                            'amount': BigNumber.from(log.data).toString(),
                            'to': '0x' + log.topics[3].substr(log.topics[3].length - 40, 40),
                            'from': '0x' + log.topics[2].substr(log.topics[2].length - 40, 40),
                            'tokenId': tokenId,
                            'token' : token,
                            'contract' : contract,
                        });
                    } else if (this.type === 'erc20' && contract.supportedInterfaces.includes('erc20')) {
                        transfers.push({
                            'value': log.data,
                            'wei': BigNumber.from(log.data).toString(),
                            'to': '0x' + log.topics[2].substr(log.topics[2].length - 40, 40),
                            'from': '0x' + log.topics[1].substr(log.topics[1].length - 40, 40),
                            'contract' : contract,
                        });
                    }
                }
            }
            for(let i = 0; i < transfers.length;i++){
                transfers[i] = this.parseTransfer(transfers[i]);
            }
            this.isLoading = false;
            return  transfers;
        },
    },

    async mounted() {
        this.pTransfers = await this.loadTransfers();
    },
    data() {
        return {
            BigNumber: BigNumber,
            pTransfers: [],
            isExpanded: this.expanded,
            more: false,
            isLoading: false,
        };
    },
};
</script>

<template>
<div v-if="pTransfers.length > 0" class="fit row wrap justify-start items-start content-start">
    <div  class="col-3">
        <strong>
            <span>{{ $t('pages.transfers_title', {'type': type.toUpperCase() }) }}</span>
        </strong>
    </div>
    <div class="col-9 erc-transfers">
        <div
            v-for="(transfer, index) in pTransfers"
            :key="'erct' + index"
            class="fit row wrap justify-start items-start content-start"
        >
            <div class="col-4">
                <q-icon class="list-arrow" name="arrow_right"/>
                <strong>
                    {{ $t('components.transaction.form_from') }}
                </strong>
                <AddressField
                    :highlight="trxFrom.toLowerCase() === transfer.from.toLowerCase() && pTransfers.length > 1"
                    :address="transfer.from"
                    :truncate="15"
                    copy
                    :name="
                        transfer.contract && transfer.from.toLowerCase() === transfer.contract.address.toLowerCase()
                            && transfer.contract.name ?  transfer.contract.name : null
                    "
                />
            </div>
            <div class="col-3">
                <strong>{{ $t('components.transaction.form_to') }}</strong>
                <AddressField
                    :highlight="trxFrom.toLowerCase() === transfer.to.toLowerCase() && pTransfers.length > 1"
                    :address="transfer.to"
                    :truncate="15"
                    copy
                    :name="
                        transfer.contract && transfer.to.toLowerCase() === transfer.contract.address.toLowerCase()
                            && transfer.contract.name ?  transfer.contract.name : null
                    "
                />
            </div>
            <div
                v-if="
                    transfer.contract.supportedInterfaces.includes('erc721')
                        || transfer.contract.supportedInterfaces.includes('erc1155')
                "
                class="flex col-4"
            >
                <strong class="col-2">
                    {{ $t('components.transaction.form_token') }}
                </strong>
                <router-link
                    :if="transfer.contract?.properties?.symbol"
                    class="q-ml-xs q-mr-xs"
                    :to="'/address/' + transfer.contract.address"
                >
                    <span>{{ transfer.contract?.properties?.symbol.slice(0, 6) }}</span>
                    <span v-if="transfer.contract?.properties?.symbol.length > 6">...</span>
                </router-link>
                <div class="col">
                    <span v-if="transfer.tokenId.length > 15">
                        <span class="word-break">
                            {{ ' #' + transfer.tokenId.slice(0, 15) + '...' }}
                            <CustomTooltip :content="'#' + transfer.tokenId" />
                        </span>
                    </span>
                    <span v-else>
                        <span class="word-break">
                            {{ ' #' + transfer.tokenId }}
                        </span>
                    </span>
                    <span v-if="transfer.token?.imageCache" class="q-ml-xs">
                        <a
                            clickable="clickable"
                            :href="transfer.token?.imageCache + '/1440.webp'"
                            target="_blank"
                        >
                            <q-img
                                :src="transfer.token?.imageCache + '/280.webp'"
                                class="nft-thumbnail"
                            />
                            <CustomTooltip :content="$t('components.transaction.consult_media')" />
                        </a>
                    </span>
                    <span v-if="transfer.contract.supportedInterfaces.includes('erc1155')">
                        <a clickable="clickable" :href="'/address/' + transfer.token.address" target="_blank">
                            <CustomTooltip :content="$t('components.transaction.consult_collection')" />
                        </a>
                    </span>
                    <span>
                        <span v-if="transfer.metadata" class="word-break">
                            <a clickable="clickable">
                                <q-icon class="q-pb-sm q-ml-xs" name="info" size="18px"/>
                            </a>
                            <CustomTooltip :content="transfer.metadata" :long="true" />
                        </span>
                        <span v-if="transfer.tokenUri?.startsWith('http')" class="word-break">
                            <a clickable="clickable" :href="transfer.tokenUri" target="_blank">
                                <q-icon class="q-pb-sm q-ml-xs" name="description" size="18px"/>
                            </a>
                            <CustomTooltip :content="$t('components.transaction.consult_metadata')" />
                        </span>
                    </span>
                </div>
            </div>
            <div v-else class="col-5 flex">
                <strong>{{ $t('components.transaction.form_token') }}</strong>
                <TokenValueField
                    :value="transfer.value"
                    :showWei="true"
                    :address="transfer.contract.address"
                    :truncate="6"
                />
            </div>
        </div>
        <div v-if="!isExpanded && more" class="expand-btn fit row items-center" @click="expand">
            <div class="separator"></div>
            <div class="flex items-center">
                <q-icon name="add_circle_outline" class="q-mr-xs" />
                <span>{{ $t('global.expand') }}</span>
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
pre
    font-size: 0.8em
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
.body--dark .separator
    border-top: 1px dashed rgba(255, 255, 255, 0.3)
.separator
    z-index: 1
    background: transparent
    position: absolute
    width: 320px
    border-top: 1px dashed rgba(0, 0, 0, 0.3)
    top: 10px
.nft-thumbnail:hover
    transform: scale(1.2)
.nft-thumbnail
    transition: 500ms transform ease
    vertical-align: middle
    border-radius: 100%
    width: 16px
    height: 16px
    margin-top: -7px
.coin-icon
    width: 16px
    height: 16px
    margin-top: -6px
    margin-right: .15rem
    vertical-align: middle
    border-radius: 100%
.erc-transfers
    .row
        .col-5
            strong
                margin-right: 3px

@media (max-width: 1024px)
    .row
        .col-3
            width: 100%
    .erc-transfers
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


@media screen and (max-width: 420px)
    .coin-icon
        width: 12px
        height: 12px
        margin-right: 3px
        margin-top: -3px
</style>
