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
        contract: {
            type: Object,
        },
    },
    data(props) {
        return ({
            functions: [],
            verified: props.contract.verified,
        });
    },
    async mounted() {
        let read = [];
        let write = [];
        this.verified = this.contract.verified;
        this.contract.abi.forEach((a) => {
            if (a.type !== 'function') {
                return;
            }

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
<div :key="'vc' + verified" class="q-pt-md">
    <q-list>
        <q-expansion-item
            v-for="func in (write ? functions.write : functions.read)"
            :key="func.name"
            :label="func.name"
            class="shadow-2 q-mb-md"
        >
            <q-card>
                <div class="q-pa-md">
                    <FunctionInterface
                        :abi="func"
                        :contract="contract"
                        :group="write ? 'write' : 'read'"
                        :run-label="write ? 'Write' : 'Query'"
                    />
                </div>
            </q-card>

        </q-expansion-item>
    </q-list>
    <small v-if="verified === false" class="row q-pb-md items-center flex text-grey">
        <q-icon name="info" size="12px" class="q-mr-sm" />
        <span>{{ $t('components.contract_tab.abi_loaded_from_interface') }}</span>
    </small>
</div>
</template>
