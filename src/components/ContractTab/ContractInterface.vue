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
        });

        this.functions = {
            read: sortAbiFunctionsByName(read),
            write: sortAbiFunctionsByName(write),
        };
    },
};
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
