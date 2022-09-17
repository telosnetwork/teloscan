<script>

import { formatBN } from 'src/lib/utils';
import { TRANSFER_FUNCTION_SIGNATURES } from 'src/lib/functionSignatures';

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
        }
    },
    mounted() {
        this.setValues();
    },
    methods: {
        async setValues() {
            if (!this.trx.parsedTransaction)
                return;

            if (TRANSFER_FUNCTION_SIGNATURES.includes(this.trx.parsedTransaction.sighash) && this.contract && this.contract.token) {
                this.transferAmount = `${formatBN(this.trx.parsedTransaction.args[1], this.contract.token.decimals, 5)} ${this.contract.token.symbol}`;
            }
        },
    },
}
</script>

<template lang="pug">
div
  span(v-if="trx.parsedTransaction" )
    span() {{ trx.parsedTransaction.name.length > 8 && shorten ? `${trx.parsedTransaction.name.slice(0,8)}...` : trx.parsedTransaction.name  }}
    span(v-if="transferAmount")  ({{ transferAmount }})
    q-tooltip(v-if="shorten" anchor="center middle" self="center middle")
      | {{ trx.parsedTransaction.name }}
  span(v-else)
    span() {{trx.input_data.length > 8 && shorten ? `${trx.input_data.slice(0,8)}...` : trx.input_data}}
    q-tooltip( v-if="shorten" anchor="center middle" self="center middle")
      | {{ trx.input_data.slice(0,8) }}
</template>
