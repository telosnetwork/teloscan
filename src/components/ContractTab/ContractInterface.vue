<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { sortAbiFunctionsByName } from 'src/lib/utils';
import { AbiFunction } from 'src/types/AbiFunction';

import FunctionInterface from 'components/ContractTab/FunctionInterface.vue';
import AppHeaderWallet from 'src/components/header/AppHeaderWallet.vue';

const props = defineProps({
    write: {
        type: Boolean,
        required: true,
    },
    contract: {
        type: Object,
        required: true,
    },
});

const functions = ref({ read: [] as AbiFunction[], write: [] as AbiFunction[] });

onMounted(async () => {
    const readFunctions: AbiFunction[] = [];
    const writeFunctions: AbiFunction[] = [];

    props.contract.abi.forEach((abiItem: AbiFunction) => {
        if (abiItem.type !== 'function') {
            return;
        }

        if (abiItem.stateMutability === 'view') {
            readFunctions.push(abiItem);
        } else {
            writeFunctions.push(abiItem);
        }
    });

    functions.value = {
        read: sortAbiFunctionsByName(readFunctions),
        write: sortAbiFunctionsByName(writeFunctions),
    };
});
</script>

<template>
<div class="q-pt-md">
    <AppHeaderWallet v-if="props.write" class="c-login-button"/>
    <q-list>
        <q-expansion-item
            v-for="func in (props.write ? functions.write : functions.read)"
            :key="func.name"
            :label="func.name"
            class="shadow-2 q-mb-md"
        >
            <q-card>
                <div class="q-pa-md">
                    <FunctionInterface
                        :abi="func"
                        :contract="props.contract"
                        :group="props.write ? 'write' : 'read'"
                        :run-label="props.write ? 'Write' : 'Query'"
                    />
                </div>
            </q-card>
        </q-expansion-item>
    </q-list>
    <small v-if="props.contract.autoloadedAbi" class="row q-pb-md items-start flex text-grey no-wrap">
        <q-icon name="info" size="12px" class="q-mr-xs q-mt-xs" />
        <span>{{ $t('components.contract_tab.abi_loaded_from_interface') }}</span>
    </small>
</div>
</template>
<style lang="scss">
.c-login-button{
    margin-bottom: 0.5rem;
}
</style>
