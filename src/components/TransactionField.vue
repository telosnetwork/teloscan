<script>
export default {
    name: 'TransactionField',
    props: {
        transactionHash: {
            type: String,
            required: true,
        },
    },
}
</script>

<template lang="pug">
router-link(:to="`/tx/${this.transactionHash}`" :key="$route.path" ) {{ transactionHash.slice(0,20) }}...
  //- eztodo add copy button here
</template>
