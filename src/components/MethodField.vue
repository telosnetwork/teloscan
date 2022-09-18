<script>

import { formatBN } from 'src/lib/utils';
import { TRANSFER_SIGNATURES } from 'src/lib/abi/signature/transfer_signatures';

export default {
    name: 'MethodField',
    props: {
        trx: {
            type: Object,
            required: true,
        },
        contract: {
            type: Object,
            default: null,
        },
        shorten: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            transferAmount: null,
            transferTo: null,
            expand: false,
        }
    },
    mounted() {
        this.setValues();
    },
    methods: {
        toggle(){
            this.expand = !this.expand;
        },
        async setValues() {
            if (!this.trx.parsedTransaction)
                return;

            if (TRANSFER_SIGNATURES.includes(this.trx.parsedTransaction.sighash) && this.contract && this.contract.token && this.contract.token.decimals) {
                this.transferAmount = `${formatBN(this.trx.parsedTransaction.args[1], this.contract.token.decimals, 5)} ${this.contract.token.symbol}`;
            }
        },
    },
}
</script>

<template lang="pug">
div
  span(v-if="trx.parsedTransaction" )
    span() {{  trx.parsedTransaction.name  }}
    span(v-if="transferAmount")  ({{ transferAmount }})
    q-tooltip(v-if="shorten" anchor="center middle" self="center middle")
      | {{ trx.parsedTransaction.name }}
  span(v-else :class="shorten && 'clickable'")
    span(v-if="!expand" v-on:click="shorten && toggle()" clickable) {{trx.input_data.length > 10 && shorten ? `${trx.input_data.slice(0,10)}` : trx.input_data}}
    q-tooltip( v-if="shorten && !expand") Click to expand the function signature
    span( v-if="shorten && expand" anchor="center middle" class="word-break" self="center middle" v-on:click="toggle()")
      | {{ trx.input_data }}
</template>
