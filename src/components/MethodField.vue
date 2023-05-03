<script>

import { ZERO_ADDRESSES } from 'src/lib/utils';

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
            expand: false,
            name: '',
            fullName: '',
            icon: false,
            iconTooltip: false,
        };
    },
    async mounted() {
        await this.setValues();
    },
    methods: {
        toggle(){
            this.expand = !this.expand;
        },
        async setValues() {
            if (
                !this.trx.parsedTransaction
                && this.trx.from === ZERO_ADDRESSES
                && this.trx.value > 0
            ){
                this.icon = 'keyboard_double_arrow_down';
                this.iconTooltip = this.$t('components.transaction.native_deposit');
                this.fullName = 'deposit';
            } else if(
                !this.trx.parsedTransaction
                && this.trx.to === ZERO_ADDRESSES
                && this.trx.value > 0
                && parseInt(this.trx.gasPrice) === 0
            ) {
                this.icon = 'keyboard_double_arrow_up';
                this.iconTooltip = this.$t('components.transaction.native_withdraw');
                this.fullName = 'withdraw';
            } else if (!this.trx.parsedTransaction && this.trx.value > 0) {
                this.fullName = 'TLOS transfer';
            } else if (this.trx.parsedTransaction) {
                this.fullName = this.trx.parsedTransaction.name;
            }

            this.name = (this.shortenName && this.fullName.length > 11)
                ? `${this.fullName.slice(0, 8)}...`
                : this.fullName
            ;
        },
    },
};
</script>

<template>
<div>
    <span v-if="name">
        <span class="flex items-center">
            <span v-if="icon" class="c-method-icon">
                <q-icon :name="icon" />
                <q-tooltip v-if="iconTooltip">
                    {{ iconTooltip }}
                </q-tooltip>
            </span>
            <span>
                {{ name }}
            </span>
        </span>
        <q-tooltip v-if="shortenName && fullName.length > 11" anchor="center middle" self="center middle">
            {{ fullName }}
        </q-tooltip>
    </span>
    <span v-else-if="trx.input !== '0x'" :class="shortenSignature && 'clickable'">
        <span v-if="!expand" class="text-grey" v-on:click="shortenSignature && toggle()">
            {{trx.input.length > 10 && (shortenSignature || shortenName) ? `${trx.input.slice(0,10)}` : trx.input}}
        </span>
        <q-tooltip v-if="shortenSignature && !expand">
            {{ $t('components.click_to_expand') }}
        </q-tooltip>
        <span
            v-if="shortenSignature && expand"
            class="word-break"
            anchor="center middle"
            self="center middle"
            v-on:click="toggle()"
        >
            {{ trx.input }}
        </span>
    </span>
</div>
</template>

<style lang="scss" scoped>
    .c-method-icon i {
        margin-top: -2px;
    }
    .c-method-icon {
        background: $purpleBright;
        margin-right: 4px;
        width: 16px;
        line-height: 16px;
        height: 16px;
        text-align: center;
        border-radius: 100%;
        color: white;
    }
</style>
