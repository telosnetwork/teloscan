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
};
</script>

<template>
<div class="transaction-field-container">
    <router-link :key="$route.path" :to="`/tx/${this.transactionHash}`">
        {{ transactionHash && transactionHash.slice(0,20) }}...
    </router-link>
    <CopyButton v-if="copy" :text="transactionHash" accompanying-text="" />
</div>
</template>

<style lang="sass">
.transaction-field-container
    display: inline-flex
    align-items: center
</style>
