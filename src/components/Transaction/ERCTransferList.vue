<script>
import AddressField from 'components/AddressField';
import { formatWei } from 'src/lib/utils';
import { BigNumber } from 'ethers';

export default {
    name: 'ERCTransfersList',
    components: {
        AddressField,
    },
    props: {
        type: {
            type: String,
            required: true,
        },
        transfers: {
            type: Array,
            required: true,
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
    <div class="col-3"><strong>{{ type + ` transfers: ` }}</strong></div>
    <div id="erc-transfers" class="col-9">
        <div
            v-for="(transfer, index) in transfers"
            :key="index"
            class="fit row wrap justify-start items-start content-start"
        >
            <div class="col-4">
                <q-icon class="list-arrow" name="arrow_right"/>
                <strong>
                    {{ $t('components.transaction.form_from') }}
                </strong>
                <AddressField
                    :highlight="trxFrom === transfer.from && transfers.length > 1"
                    :address="transfer.from"
                    :truncate="15"
                    copy
                    :name="contract && transfer.from === contract.address && contract.name ?  contract.name : null"
                />
            </div>
            <div class="col-3">
                <strong>{{ $t('components.transaction.form_to') }}</strong>
                <AddressField
                    :highlight="trxFrom === transfer.to && transfers.length > 1"
                    :address="transfer.to"
                    :truncate="15"
                    copy
                    :name="contract && transfer.to === contract.address && contract.name ?  contract.name : null"
                />
            </div>
            <div v-if="type === 'ERC721' || type==='ERC1155'" class="flex col-4">
                <strong class="col-2">
                    {{ $t('components.transaction.form_token') }}
                </strong>
                <router-link class="q-ml-xs" :to="'/address/' + transfer.token.address">
                    {{ transfer.token.symbol }}
                </router-link>
                <div class="col">
                    <span v-if="transfer.tokenId.length > 15">
                        <span class="word-break q-pl-xs">
                            {{ ' #' + transfer.tokenId.slice(0, 15) + '...' }}
                            <q-tooltip>{{ '#' + transfer.tokenId }}</q-tooltip>
                        </span>
                    </span>
                    <span v-else>
                        <span class="word-break q-pl-xs">
                            {{ ' #' + transfer.tokenId }}
                        </span>
                    </span>
                    <span v-if="type==='ERC1155'">
                        <a clickable="clickable" :href="'/address/' + transfer.token.address" target="_blank">
                            <q-tooltip>{{ $t('components.transaction.consult_collection') }}</q-tooltip>
                        </a>
                    </span>
                    <span v-if="transfer.token.metadata" class="word-break">
                        <span>
                            <a clickable="clickable" :href="transfer.token.metadata" target="_blank">
                                <q-icon class="q-pb-sm q-ml-xs" name="description" size="14px"/>
                            </a>
                            <q-tooltip>{{ $t('components.transaction.consult_metadata') }}</q-tooltip>
                        </span>
                        <span>
                            <a
                                v-if="transfer.token.image"
                                class="q-pl-xs"
                                clickable="clickable"
                                :href="transfer.token.image"
                                target="_blank"
                            >
                                <q-icon class="q-pb-sm q-ml-xs" name="image" size="14px"/>
                            </a>
                            <q-tooltip>{{ $t('components.transaction.consult_media') }}</q-tooltip>
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
                        {{ formatWei(transfer.value, transfer.token.decimals) }}
                        <q-tooltip>{{ $t('components.transaction.show_wei') }}</q-tooltip>
                    </span>
                </span>
                <router-link class="q-ml-xs" :to="`/address/${transfer.token.address}`">
                    <span>
                        <span>{{ transfer.token.symbol.slice(0, 10) }}</span>
                        <span v-if="transfer.token.symbol.length > 10">...</span>
                    </span>
                    <q-tooltip v-if="transfer.token.symbol.length > 10">{{ transfer.token.symbol }}</q-tooltip>
                </router-link>
            </div>
        </div>
    </div>
</div>
<br>
</template>

<!--eslint-enable-->
<style scoped lang="sass">
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
        .col-3, .col-9
            width: 100%
            padding-left: 0px
        .col-9
            padding-top: 10px
</style>
