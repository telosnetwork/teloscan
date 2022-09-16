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
        a(:href="'/address/' + transfer.token.address" style="margin-left: 3px;") {{ transfer.token.symbol }}
        span {{ ' #' + transfer.tokenId }}
      div(v-else class="col-4")
        strong {{ ` Token : ` }}
        span {{ transfer.value }}
        a(:href="'/address/' + transfer.token.address" style="margin-left: 3px;") {{ transfer.token.symbol }}
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
</style>