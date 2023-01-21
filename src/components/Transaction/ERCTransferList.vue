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
<!-- eslint-disable max-len -->
<template lang="pug">
div(class="fit row wrap justify-start items-start content-start")
  div(class="col-3")
    strong {{ type + ` transfers: ` }}
  div(class="col-9" id="erc-transfers")
    div(v-for="transfer in transfers" class="fit row wrap justify-start items-start content-start")
      div(class="col-4")
        q-icon(name="arrow_right" class="list-arrow")
        strong {{ $t('components.transaction.form_from') }}
        <AddressField :highlight="trxFrom === transfer.from && transfers.length > 1" :address="transfer.from" :truncate="15" copy :name="contract && transfer.from === contract.address && contract.name ?  contract.name : null" />
      div(class="col-3")
        strong {{ $t('components.transaction.form_to') }}
        <AddressField :highlight="trxFrom === transfer.to && transfers.length > 1" :address="transfer.to" :truncate="15" copy :name="contract && transfer.to === contract.address && contract.name ?  contract.name : null" />
      div.flex(v-if="type === 'ERC721' || type==='ERC1155'" class="col-4")
        strong.col-2 {{ $t('components.transaction.form_token') }}
        router-link(:to="'/address/' + transfer.token.address" class="q-ml-xs") {{ transfer.token.symbol }}
        div.col
          span(v-if="transfer.tokenId.length > 15")
            span(class="word-break q-pl-xs") {{ ' #' + transfer.tokenId.slice(0, 15) + '...' }}
              q-tooltip {{ '#' + transfer.tokenId }}
          span(v-else)
              span(class="word-break q-pl-xs") {{ ' #' + transfer.tokenId }}
          span(v-if="type==='ERC1155'")
            a(clickable :href="'/address/' + transfer.token.address" target="_blank")
              q-icon(name="library_books" size="14px" class="q-pb-sm q-ml-xs")
            q-tooltip {{ $t('components.transaction.consult_collection') }}
          span(class="word-break" v-if="transfer.token.metadata")
            span
              a(clickable :href="transfer.token.metadata" target="_blank")
                q-icon(name="description" size="14px" class="q-pb-sm q-ml-xs")
              q-tooltip {{ $t('components.transaction.consult_metadata') }}
            span
              a(v-if="transfer.token.image" clickable :href="transfer.token.image" target="_blank" class="q-pl-xs")
                q-icon(name="image" size="14px" class="q-pb-sm q-ml-xs")
              q-tooltip {{ $t('components.transaction.consult_media') }}
      div(v-else class="col-5")
        strong {{ $t('components.transaction.form_token') }}
        span.clickable(@click="transfer.showWei = !transfer.showWei")
            span(v-if="transfer.showWei") {{ BigNumber.from(transfer.value) }}
                q-tooltip {{ $t('components.transaction.show_total') }}
            span(v-else) {{ formatWei(transfer.value, transfer.token.decimals) }}
                q-tooltip {{ $t('components.transaction.show_wei') }}
        router-link(:to="`/address/${transfer.token.address}`" class="q-ml-xs")
            span
                span {{ transfer.token.symbol.slice(0, 10) }}
                span(v-if="transfer.token.symbol.length > 10") ...
            q-tooltip(v-if="transfer.token.symbol.length > 10") {{ transfer.token.symbol }}
br
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
