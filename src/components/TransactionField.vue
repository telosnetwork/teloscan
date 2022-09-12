<script>
import CopyButton from './CopyButton.vue';
export default {
    name: 'TransactionField',
    components:{
        CopyButton,
    },
    props: {
        transactionHash: {
            type: String,
            required: true,
        },
    },
}
</script>

<template lang="pug">
div.transaction-field-container
    router-link(:to="`/tx/${this.transactionHash}`" :key="$route.path" ) {{ transactionHash.slice(0,20) }}...
    CopyButton(
        :text="transactionHash"
        accompanying-text=""
        class="q-mb-md"
    )
</template>
<style lang="sass">
.transaction-field-container
    height: 1.25rem
</style>
