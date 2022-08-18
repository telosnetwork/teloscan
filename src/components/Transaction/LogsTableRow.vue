<script>
import AddressField from 'components/AddressField';
import { TRANSFER_SIGNATURE } from 'src/lib/functionSignatures';

export default {
    name: 'LogsTableRow',
    components: {
        AddressField,
    },
    props: {
        log: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            expanded: false,
        }
    },
    async mounted() {
        await this.loadTokenContract();
    },
    methods: {
        async loadTokenContract() {
            if(this.log.contract) return;
            if(this.log.function_signature === TRANSFER_SIGNATURE){
                this.log.isTransfer = true;
                const contract = await this.$contractManager.getContract(this.log.address);
                if (!contract || !contract.token) return;
                this.log.token = contract.token;
            }
        },
    },
}
</script>
<style lang="sass">
    .logTableRowHead
        background: rgba(0, 0, 0, 0.1)
        padding: 10px 20px
        margin-bottom: 12px
        cursor: pointer
        border-radius: 5px
        transition: 300ms background-color ease

        .body--dark
            .logTableRowHead
                background: rgba(0, 0, 0, 0.25)

    .logTableRow
        margin-bottom: 25px

    @media (max-width: $breakpoint-sm-max)
        .logTableRow
            .row
                display: block
                margin-bottom: 10px

</style>
<template lang="pug">
    div(class="logTableRow" :key="(log.params) ? 1 : 0")
      div(class="logTableRowHead"  @click="expanded = !expanded")
          div(v-if="log.name")
            q-icon(v-if="!expanded" name="arrow_right" size="sm" style="margin-left: -8px;")
            q-icon(v-else name="arrow_drop_down" size="sm" style="margin-left: -8px;")
            strong {{ log.name }}
          div(v-else)
            q-icon(v-if="!expanded" name="arrow_right" size="sm" style="margin-left: -8px;")
            q-icon(v-else name="arrow_drop_down" size="sm" style="margin-left: -8px;")
            strong Unknown ({{ log.topics[0].substr(0, 10) }})
      div(v-if="expanded" class="q-pl-md")
        div(v-if="log.name")
         div(v-for="(param, index) in log.inputs" :key="'log' + index" class="fit row justify-start items-start content-start")
           div(v-if="param.name" class="col-2") {{ param.name }} ({{ param.type }}) :
           div(v-else class="col-2") {{ param.type }}:
           div(v-if="param.type == 'address'" class="col-9" )
             div <AddressField :address="log.args[index]"  :truncate="0" copy />
           div(v-else-if="param.type == 'uint256'" :key="log.isTransfer" class="col-9" )
             div(v-if="log.isTransfer && log.token")
               div {{ log.args[index] / (10 ** log.token.decimals) }}
                a(:href="'/address/' + log.address") {{ ' ' + log.token.symbol }}
             div(v-else  class="fit row wrap justify-start items-start content-start")
               div {{ log.args[index] }}
           div(v-else class="fit row wrap justify-start items-start content-start" class="col-9" )
             div {{ log.args[index] }}
        div(v-else) {{ log }}
</template>
