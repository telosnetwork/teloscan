<script>
import AddressField from 'components/AddressField';
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
        contract: {
            type: Object,
            required: true,
        },
    },
}
</script>
<template lang="pug">
div(class="fit row wrap justify-start items-start content-start")
  div(class="col-3")
    strong {{ type + ` transfers: ` }}
  div(class="col-9" id="erc-transfers")
    div(v-for="transfer in transfers" class="fit row wrap justify-start items-start content-start")
      div(class="col-4")
        q-icon(name="arrow_right" class="list-arrow")
        strong {{ `From : ` }}
        <AddressField :address="transfer.from" :truncate="16" copy :name="transfer.from === contract.address && contract.name ?  contract.name : null" />
      div(class="col-4")
        strong {{ ` To : ` }}
        <AddressField :address="transfer.to" :truncate="16" copy :name="transfer.to === contract.address && contract.name ?  contract.name : null" />
      div(v-if="type==='ERC721' || type==='ERC1155'" class="col-4")
        strong {{ ` Token : ` }}
        router-link(:to="'/address/' + transfer.token.address" class="q-ml-xs") {{ transfer.token.symbol }}
        span(class="word-break") {{ ' #' + transfer.tokenId }}
        span(class="word-break" v-if="transfer.token.metadata")
          span
            a(clickable :href="transfer.token.metadata" target="_blank")
              q-icon(name="description" size="14px" class="q-pb-sm q-ml-xs")
            q-tooltip Consult metadata
          span
            a(v-if="transfer.token.image" clickable :href="transfer.token.image" target="_blank" class="q-pl-xs")
              q-icon(name="image" size="14px" class="q-pb-sm q-ml-xs")
            q-tooltip Consult media
      div(v-else class="col-4")
        strong {{ ` Token : ` }}
        span {{ transfer.value }}
        router-link(:to="'/address/' + transfer.token.address" class="q-ml-xs") {{ transfer.token.symbol }}
  br
br
</template>
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