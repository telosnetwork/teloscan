<script lang="javascript">

export default {
    name: 'ContractByteCode',
    props: {
        contract: {
            type: Object,
        },
    },
    data() {
        return {
            loading: true,
            bytecode: null,
            rpcId: 0,
        };
    },
    async mounted() {
        if(this.bytecode){
            this.loading = false;
            return;
        }
        try{
            let bytecode = await this.$evmEndpoint.post('/evm', {
                jsonrpc: '2.0',
                id: ++this.rpcId,
                method: 'eth_getCode',
                params: [this.contract.address],
            });
            if(bytecode.data?.result){
                this.bytecode = bytecode.data.result;
            }
        } catch(e){
            console.error(e);
        }
        this.loading = false;
    },

};
</script>

<template>
<div class="q-pt-lg q-pb-md">
    <q-spinner v-if="loading" size="md" />
    <div v-else class="bytecode shadow-2">
        <pre>{{ bytecode }}</pre>
    </div>
</div>
</template>

<style scoped lang="sass">
.bytecode
    padding: 10px 15px 10px 15px
    background: rgba(103, 110, 203, 0.08)
.body--dark .bytecode
    background: rgba(47, 60, 156, 0.11)
pre
    white-space: unset
    max-width: 100%
    margin: 0
    word-break: break-all
</style>
