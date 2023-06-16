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
    data() {
        if(this.contract.abi?.length > 0){
            return ({
                source: true,
                write: false,
            });
        }
        return ({
            source: false,
            write: false,
        });
    },
    computed: {
        abi() {
            const abi  = this.contract.abi;

            if (!abi || abi === null || !Array.isArray(abi)) {
                return false;
            }

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
};
</script>

<template>
<div v-if="abi" :key="contract.address + abi.length" class="contract-tab">
    <div class="flex justify-between items-center">
        <q-btn-group >
            <q-btn
                :outline="codeSeleted"
                :label="$t('components.contract_tab.code')"
                push
                @click="source = true; write = false"
            />
            <q-btn
                :outline="readSelected"
                :label="$t('components.contract_tab.read')"
                push
                @click="source = false; write = false"
            />
            <q-btn
                :outline="writeSelected"
                :label="$t('components.contract_tab.write')"
                push
                @click="source = false; write = true"
            />
        </q-btn-group>
        <CopyButton
            :text="abi"
            :accompanying-text="$t('components.contract_tab.copy_abi_to_clipboard')"
        />
    </div>
    <ContractSource v-if="source" />
    <ContractInterface
        v-else
        :write="write"
        :contract="contract"
    />
</div>
</template>

<style lang='sass'>
.contract-tab .vjs-tree-list-holder-inner
    padding-bottom: 20px
.contract-tab
    margin-left: 2rem
    margin-right: 2rem
    padding-top: 1rem

@media screen and (max-width: 764px)
    .contract-tab > .items-center .c-copy-button
        margin-top: 12px

    .contract-tab > .items-center
        display: block

</style>
