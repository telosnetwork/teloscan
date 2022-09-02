<script>

import { formatBN } from 'src/lib/utils';

const ERC20_SIGHASH = '0xa9059cbb';

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

            if (this.trx.parsedTransaction.sighash === ERC20_SIGHASH && this.contract) {
                this.transferAmount = `${formatBN(this.trx.parsedTransaction.args['amount'], this.contract.token.decimals, 5)} ${this.contract.token.symbol}`;
            }
        },
    },
}
</script>

<template lang="pug">
div
  span(v-if="trx.parsedTransaction" )
    div() {{ trx.parsedTransaction.name.length > 8 && shorten ? `${trx.parsedTransaction.name.slice(0,8)}...` : trx.parsedTransaction.name  }}
    div() {{ transferAmount }}
    q-tooltip(v-if="shorten" anchor="center middle" self="center middle")
      | {{ trx.parsedTransaction.name }}
  span(v-else)
    div() {{trx.input_data.length > 8 && shorten ? `${trx.input_data.slice(0,8)}...` : trx.input_data}}
    q-tooltip( v-if="shorten" anchor="center middle" self="center middle")
      | {{ trx.input_data.slice(0,8) }}
</template>
