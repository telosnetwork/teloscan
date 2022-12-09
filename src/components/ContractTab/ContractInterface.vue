<script lang="javascript">
import FunctionInterface from 'components/ContractTab/FunctionInterface';

import { sortAbiFunctionsByName } from 'src/lib/utils';

export default {
    name: 'ContractInterface',
    components: { FunctionInterface },
    props: {
        write: {
            type: Boolean,
            required: true,
        },
    },
    data: () => ({
        functions: [],
        contract: [],
    }),
    async mounted() {
        this.contract = await this.$contractManager.getContract(this.$route.params.address);
        let read = [];
        let write = [];
        this.contract.abi.forEach(a => {
            if (a.type !== 'function')
                return;

            if (a.stateMutability === 'view') {
                read.push(a);
            } else {
                write.push(a);
            }
        })

        this.functions = {
            read: sortAbiFunctionsByName(read),
            write: sortAbiFunctionsByName(write),
        }
    },
}
</script>

<template>
<div class="q-pa-md">
    <q-list>
        <q-expansion-item
            v-for="func in (write ? functions.write : functions.read)"
            :key="func.name"
            :label="func.name"
            class="shadow-2 q-mb-md"
        >
            <q-card>
                <div class="q-pa-md">
                    <function-interface
                        :abi="func"
                        :contract="contract"
                        :group="write ? 'write' : 'read'"
                        :run-label="write ? 'Write' : 'Query'"
                    />
                </div>
            </q-card>

        </q-expansion-item>
    </q-list>
</div>
</template>

<!--<style lang='sass'>-->
<!--.interface-list-->
<!--  margin-bottom: 1.5rem-->

<!--.interface-item.q-expansion-item-->
<!--  border: .125rem solid grey-->
<!--  border-radius: .25rem-->
<!--  margin-top: 1rem-->
<!--  font-size: .70rem-->
<!--  &.q-expansion-item&#45;&#45;expanded .q-item-->
<!--    border-bottom: .125rem solid grey-->
<!--    margin-bottom: 1rem-->

<!--.interface-input .q-input-->
<!--  border-width: .125rem-->
<!--  border-style: solid-->
<!--  border-color: gray-->
<!--  border-radius: .25rem-->
<!--  margin: 0 1rem 1rem 1rem-->
<!--  padding-bottom: 2rem-->
<!--  padding-right: 1rem-->
<!--  padding-left: 1rem-->

<!--</style>-->
