<script>
import AddressField from 'components/AddressField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';
import { getIcon } from 'src/lib/token-utils';
import CustomTooltip  from 'components/CustomTooltip';
import TokenValueField from 'components/TokenValueField';

export default {
    name: 'ERCTransfersList',
    components: {
        AddressField,
        CustomTooltip,
        TokenValueField,
    },
    props: {
        transfers: {
            type: Array,
            required: true,
        },
        title: {
            type: String,
            required: false,
        },
        trxFrom: {
            type: String,
            required: false,
        },
        contract: {
            type: Object,
            required: false,
        },
    },
    methods: {
        formatWei,
        getIcon,
    },
    data(props) {
        let transfers = [...props.transfers];
        for(let i = 0; i < transfers.length;i++){
            if(transfers[i].token?.metadata){
                transfers[i].metadata = JSON.parse(transfers[i].token.metadata);
                Object.keys(transfers[i].metadata).forEach((key) => {
                    if(['image', 'attributes', 'name', 'description'].includes(key) === false){
                        delete transfers[i].metadata[key];
                    }
                });
            }
        }
        return {
            BigNumber: BigNumber,
            pTransfers: transfers,
        };
    },
};
</script>

<template>
<div class="fit row wrap justify-start items-start content-start">
    <div  class="col-3"><strong>{{ title }}</strong></div>
    <div class="col-9 erc-transfers">
        <div
            v-for="(transfer, index) in pTransfers"
            :key="'erct' + index +  pTransfers.length"
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
                    {{ transfer.contract?.properties?.symbol }}
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
                            <q-img :src="transfer.token?.imageCache + '/280.webp'" class="nft-thumbnail" />
                            <CustomTooltip :content="$t('components.transaction.consult_media')" />
                        </a>
                    </span>
                    <span v-if="transfer.contract.supportedInterfaces.includes('erc1155')">
                        <a clickable="clickable" :href="'/address/' + transfer.token.address" target="_blank">
                            <CustomTooltip :content="$t('components.transaction.consult_collection')" />
                        </a>
                    </span>
                    <span>
                        <span
                            v-if="transfer.metadata"
                            class="word-break"
                        >
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
    </div>
</div>
<br>
</template>

<!--eslint-enable-->
<style scoped lang="sass">
pre
    font-size: 0.8em
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
