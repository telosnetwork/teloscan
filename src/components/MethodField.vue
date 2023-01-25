<script>

import { formatWei } from 'src/lib/utils';
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
        shortenSignature: {
            type: Boolean,
            default: false,
        },
        shortenName: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            transferAmount: null,
            transferTo: null,
            expand: false,
        };
    },
    mounted() {
        this.setValues();
    },
    methods: {
        toggle(){
            this.expand = !this.expand;
        },
        async setValues() {
            if (!this.trx.parsedTransaction) {
                return;
            }

            if (TRANSFER_SIGNATURES.includes(this.trx.parsedTransaction.sighash) && this?.contract?.token?.decimals) {
                const wei = formatWei(this.trx.parsedTransaction.args[1], this.contract.token.decimals);
                this.transferAmount = `${wei} ${this.contract.token.symbol}`;
            }
        },
    },
};
</script>

<template>
<div>
    <span v-if="trx.parsedTransaction">
        <span>
            {{
                trx.parsedTransaction.name.length > 11 && shortenName ?
                    `${trx.parsedTransaction.name.slice(0,8)}...` :
                    trx.parsedTransaction.name
            }}
        </span>
        <span v-if="transferAmount"> ({{ transferAmount }})</span>
        <q-tooltip v-if="shortenName" anchor="center middle" self="center middle">
            {{ trx.parsedTransaction.name }}
        </q-tooltip>
    </span>
    <span v-else :class="shortenSignature && 'clickable'">
        <span v-if="!expand" clickable="clickable" v-on:click="shortenSignature && toggle()">
            {{trx.input_data.length > 10 && shortenSignature ? `${trx.input_data.slice(0,10)}` : trx.input_data}}
        </span>
        <q-tooltip v-if="shortenSignature &amp;&amp; !expand">
            {{ $t('components.click_to_expand') }}
        </q-tooltip>
        <span
            v-if="shortenSignature && expand"
            class="word-break"
            anchor="center middle"
            self="center middle"
            v-on:click="toggle()"
        >
            {{ trx.input_data }}
        </span>
    </span>
</div>
</template>
