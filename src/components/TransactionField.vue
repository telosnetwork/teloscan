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
        color: {
            type: String,
            required: false,
            default: 'secondary',
        },
        truncate: {
            type: Number,
            required: false,
            default: 20,
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
    <router-link :key="$route.path" :class="`text-${this.color}`" :to="`/tx/${this.transactionHash}`">
        {{ transactionHash && transactionHash.slice(0,this.truncate) }}...
    </router-link>
    <q-tooltip>{{ transactionHash }}</q-tooltip>
    <CopyButton v-if="copy" :text="transactionHash" accompanying-text="" />
</div>
</template>

<style lang="sass">
.transaction-field-container
    display: inline-flex
    align-items: center
</style>
