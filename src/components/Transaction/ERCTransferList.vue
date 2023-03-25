<script>
import AddressField from 'components/AddressField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';
import { getIcon } from 'src/lib/token-utils';

export default {
    name: 'ERCTransfersList',
    components: {
        AddressField,
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
            required: true,
        },
    },
    methods: {
        formatWei,
        getIcon,
    },
    async mounted() {
        const tokenList = await this.$contractManager.getTokenList();
        for(let i = 0; i < this.pTransfers.length;i++){
            tokenList.tokens.forEach((token) => {
                if(token.address.toLowerCase() ===  this.pTransfers.contract.toLowerCase()){
                    this.pTransfers.contract.logoURI = token.logoURI;
                }
            });
        }
    },
    setup(props) {
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
            pTransfers: transfers,
        };
    },
    data() {
        return {
            BigNumber: BigNumber,
        };
    },
};
</script>

<template>
<div class="fit row wrap justify-start items-start content-start">
    <div  class="col-3"><strong>{{ title }}</strong></div>
    <div id="erc-transfers" class="col-9">
        <div
            v-for="(transfer, index) in pTransfers"
            :key="index"
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
                    :if="contract.properties.symbol"
                    class="q-ml-xs q-mr-xs"
                    :to="'/address/' + transfer.contract.address"
                >
                    {{ contract.properties.symbol }}
                </router-link>
                <div class="col">
                    <span v-if="transfer.tokenId.length > 15">
                        <span class="word-break">
                            {{ ' #' + transfer.tokenId.slice(0, 15) + '...' }}
                            <q-tooltip>{{ '#' + transfer.tokenId }}</q-tooltip>
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
                            <q-tooltip>{{ $t('components.transaction.consult_media') }}</q-tooltip>
                        </a>
                    </span>
                    <span v-if="transfer.contract.supportedInterfaces.includes('erc1155')">
                        <a clickable="clickable" :href="'/address/' + transfer.token.address" target="_blank">
                            <q-tooltip>{{ $t('components.transaction.consult_collection') }}</q-tooltip>
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
                            <q-tooltip>
                                <pre>{{ transfer.metadata }}</pre>
                            </q-tooltip>
                        </span>
                        <span v-if="transfer.tokenUri" class="word-break">
                            <a clickable="clickable" :href="transfer.tokenUri" target="_blank">
                                <q-icon class="q-pb-sm q-ml-xs" name="description" size="18px"/>
                            </a>
                            <q-tooltip>{{ $t('components.transaction.consult_metadata') }}</q-tooltip>
                        </span>
                    </span>
                </div>
            </div>
            <div v-else class="col-5">
                <strong>{{ $t('components.transaction.form_token') }}</strong>
                <span class="clickable" @click="transfer.showWei = !transfer.showWei">
                    <span v-if="transfer.showWei">{{ BigNumber.from(transfer.value) }}
                        <q-tooltip>{{ $t('components.transaction.show_total') }}</q-tooltip>
                    </span>
                    <span v-else>
                        {{ formatWei(transfer.value, transfer.contract.properties.decimals) }}
                        <q-tooltip>{{ $t('components.transaction.show_wei') }}</q-tooltip>
                    </span>
                </span>
                <router-link
                    v-if="transfer.contract.properties?.symbol"
                    class="q-ml-xs"
                    :to="`/address/${transfer.contract.address}`"
                >
                    <span>
                        <q-img
                            v-if="transfer.contract.supportedInterfaces.includes('erc20')"
                            class="coin-icon"
                            :src="getIcon(transfer.contract.logoURI)"
                        />
                        <span>{{ transfer.contract.properties?.symbol?.slice(0, 10) }}</span>
                        <span v-if="transfer.contract.properties?.symbol?.length > 10">...</span>
                    </span>
                    <q-tooltip v-if="transfer.contract.properties?.symbol?.length > 10">
                        {{ contract.properties.symbol }}
                    </q-tooltip>
                </router-link>
            </div>
        </div>
    </div>
</div>
<br>
</template>

<!--eslint-enable-->
<style lang="sass">
    .q-tooltip
        pre
            white-space: pre-wrap
            word-break: break-all
    .q-tooltip
        word-break: break-all
        max-height: 100% !important
</style>
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
    margin-top: -5px
    margin-right: .15rem
    vertical-align: middle
    border-radius: 100%

@media (max-width: $breakpoint-sm-max)
    #erc-transfers
        .row
            display: block
            margin-bottom: 10px
            .col-4
                display: block
                width: 100%
        .list-arrow
            display: none

@media screen and (max-width: 650px)
    .row
        .col-9
            padding-left: 20px

@media screen and (max-width: 420px)
    .row
        .col-3, .col-9, .col-5
            width: 100%
            padding-left: 0px
        .col-9
            padding-top: 10px
</style>
