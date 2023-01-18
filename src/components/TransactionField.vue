<script>
import CopyButton from 'components/CopyButton';

export default {
    name: 'TransactionField',
    components:{
        CopyButton,
    },
    props: {
        transactionHash: {
            type: String,
            required: false,
        },
        copy: {
            type: Boolean,
            default: false,
        },
    },
}
</script>

<template lang="pug">
div.transaction-field-container
    router-link(
        :to="`/tx/${this.transactionHash}`"
        :key="$route.path"
    ) {{ transactionHash && transactionHash.slice(0,20) }}...
    copy-button(v-if="copy" :text="transactionHash" accompanying-text="" )
</template>

<style lang="sass">
.transaction-field-container
    display: inline-flex
    align-items: center
</style>
