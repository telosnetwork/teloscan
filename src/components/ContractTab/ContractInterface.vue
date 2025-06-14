<script setup lang="ts">
import { ref, onMounted, toRaw, watch, computed } from 'vue';
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
    updateFunction();
});

watch(() => props.contract, () => {
    updateFunction();
});

const functionsList = computed(() => props.write ? functions.value.write : functions.value.read);

function updateFunction() {
    const readFunctions: AbiFunction[] = [];
    const writeFunctions: AbiFunction[] = [];

    props.contract.abi.forEach((_abiItem: AbiFunction) => {
        const abiItem = toRaw(_abiItem);
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
}
</script>

<template>
<div class="c-contract-interface q-pt-md">
    <AppHeaderWallet v-if="props.write" class="c-login-button c-contract-interface__login"/>
    <q-list
        v-if="functionsList.length > 0"
        class="c-contract-interface__container"
    >
        <q-expansion-item
            v-for="func in functionsList"
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
                        :write="props.write"
                    />
                </div>
            </q-card>
        </q-expansion-item>
    </q-list>
    <q-item v-else>
        <q-item-section>
            <q-item-label>{{
                props.write ? $t('components.contract_tab.no_functions_write') : $t('components.contract_tab.no_functions_read')
            }}</q-item-label>
        </q-item-section>
    </q-item>
    <small v-if="props.contract.autoloadedAbi" class="row q-pb-md items-start flex text-grey no-wrap">
        <q-icon name="info" size="12px" class="q-mr-xs q-mt-xs" />
        <span>{{ $t('components.contract_tab.abi_loaded_from_interface') }}</span>
    </small>
</div>
</template>
<style lang="scss">
.c-contract-interface{
    &__container{
        padding-left: 1rem;
        padding-right: 1rem;
        padding-bottom: .5rem;
    }
    &__login{
        margin-bottom: 0.75rem !important;
        margin-left: 1rem;
    }

    .q-item__label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
}


</style>
