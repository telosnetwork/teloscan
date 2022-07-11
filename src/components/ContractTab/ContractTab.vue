<template>
<div class="contract-tab">
    <CopyButton
        v-if="abi"
        :text="abi"
        accompanying-text="Copy contract ABI JSON to clipboard"
        class="q-mb-md"
    />
    <br>

    <q-btn-group>
        <q-btn
            :outline="codeSeleted"
            label="Code"
            push
            @click="source = true"
        />
        <q-btn
            :outline="readSelected"
            label="Read"
            push
            @click="source = false; write = false"
        />
        <q-btn
            :outline="writeSelected"
            label="Write"
            push
            @click="source = false; write = true"
        />
    </q-btn-group>

    <ContractSource v-if="source" />
    <ContractInterface
        v-else
        :write="write"
    />
</div>
</template>

<script>
import ContractSource from 'components/ContractTab/ContractSource';
import ContractInterface from 'components/ContractTab/ContractInterface';
import CopyButton from 'components/CopyButton.vue';

export default {
    name: 'ContractTab',
    components: {
        ContractSource,
        ContractInterface,
        CopyButton,
    },
    props: {
        contract: {
            type: Object,
            default: () => ({}),
        },
    },
    data: () => ({
        source: true,
        write: false,
    }),
    computed: {
        abi() {
            const { abi } = this.contract;

            if (!Array.isArray(abi)) return '';

            return JSON.stringify(this.contract.abi);
        },
        codeSeleted() {
            return this.source === true;
        },
        readSelected() {
            return this.source === false && this.write === false;
        },
        writeSelected() {
            return this.source === false && this.write === true;
        },
    },
}
</script>

<style lang='sass'>
.contract-tab
    margin-left: 2rem
    margin-right: 2rem
    margin-top: 1rem
</style>
