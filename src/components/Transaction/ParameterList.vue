<script>
import AddressField from 'components/AddressField';
export default {
    name: 'ParameterList',
    components: {
        AddressField,
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
div(v-for="param in params" class="fit row wrap justify-start items-start content-start")
  div(class="col-4")
    q-icon(name="arrow_right" class="list-arrow")
    span(v-if="param.name") {{ param.name }} ({{param.type}}) :
    span(v-else) {{param.type}} :
  div(v-if="param.arrayChildren" class="col-8 word-break")
    div(v-for="(value, index) in param.value")
      div(v-if="param.arrayChildren === 'tuple'" :class="index != param.value.length - 1 ? 'q-mb-sm' : ''")
        strong Tuple {{ '#' + index}}
        div(v-for="(tuple, i) in value") {{ tuple}}
        br(v-if="index !== param.value.length - 1")
      div(v-else-if="param.arrayChildren === 'address'") <AddressField :address="value" copy :name="value === contract.address && contract.name ?  contract.name : null"   />
      div(v-else  ) {{ value }}
  div(v-else-if="param.type === 'address'" class="col-8 word-break") <AddressField :address="param.value" copy :name="param.value === contract.address && contract.name ?  contract.name : null"   />
  div(v-else  class="col-8 word-break") {{ param.value }}
</template>
<style>

</style>