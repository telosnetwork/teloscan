<script>
import JsonViewer from 'vue-json-viewer';
import AddressField from 'components/AddressField';
export default {
    name: 'ParameterList',
    components: {
        JsonViewer,
        AddressField,
    },
    methods: {
        expand(param, value) {
            this.expanded[param][value] = true;
        },
        minimize(param, value) {
            this.expanded[param][value] = false;
        },
    },
    data(){
        let expanded = [];
        for(let i=0; i < this.params.length;i++){
            expanded.push([]);
        }
        return {
            expanded: expanded,
        }
    },
    props: {
        params: {
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
div(v-for="param, pIndex in params" class="fit row wrap justify-start items-start content-start")
  div(class="col-4")
    q-icon(name="arrow_right" class="list-arrow q-mb-xs" size="sm")
    span(v-if="param.name") {{ param.name }} ({{ param.type }}) :
    span(v-else) {{ param.type }} :
  div(v-if="param.arrayChildren || param.type === 'tuple'" class="col-8 word-break" v-on:click.stop="(expanded[pIndex]['expanded']) ? minimize(pIndex, 'expanded') : expand(pIndex, 'expanded')")
    div [
    div(v-for="(value, index) in param.value" :class="(expanded[pIndex]['expanded']) ? 'q-pl-md' : 'q-pl-md hidden'")
      div(v-if="param.arrayChildren === 'tuple'" :class="index != param.value.length - 1 ? 'q-mb-md' : ''")
        strong Tuple {{ '#' + index}}
        div(v-for="(tuple, i) in value") {{ tuple }}
        br(v-if="index !== param.value.length - 1")
      div(v-else-if="param.arrayChildren === 'address'") <AddressField :address="value" copy :name="value === contract.address && contract.name ?  contract.name : null"   />
      div(v-else-if="param.arrayChildren === 'uint128' || param.arrayChildren === 'uint256'") {{ value }},
      div(v-else-if="!isNaN(value)") {{ value }},
      div(v-else-if="typeof value === 'object'" v-on:click.stop="(expanded[pIndex][index]) ? minimize(pIndex, index) : expand(pIndex, index)")
        div [
        div(v-for="(value2) in value" :class="(expanded[pIndex][index]) ? 'q-pl-md' : 'q-pl-md hidden'")
            div(v-if="!isNaN(value2)") {{ value2 }},
            div(v-else-if="typeof value2 === 'object'")
                div [
                div(v-for="(value3) in value2" class="q-pl-sm") {{ value3 }},
                div ]
            div(v-else) {{ value2 }},
        div(v-if="!expanded[pIndex][index]" class="q-px-sm ellipsis") ...
        div ]
      div(v-else) {{ value }},
    div(v-if="!expanded[pIndex]['expanded']" class="q-px-sm ellipsis") ...
    div ]
  div(v-else-if="param.type === 'address'" class="col-8 word-break") <AddressField :address="param.value" copy :name="param.value === contract.address && contract.name ?  contract.name : null"   />
  div(v-else  class="col-8 word-break") {{ param.value }}
</template>
<style scoped lang="sass">
.ellipsis
    border-radius: 5px
    display: inline-block
    margin-left: 10px
    color: $purpleSoft
    cursor: pointer
    line-height: 10px
    height: 15px
    background-color: $grey-0
</style>