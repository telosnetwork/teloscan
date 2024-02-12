<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
    getComponentForInputType,
    getExtraBindingsForInputComponent,
    inputRequiresParsing,
} from 'components/ContractTab/function-interface-utils';

import type { EvmFunctionParam } from 'src/antelope/types';

const props = defineProps<{
    inputs: Array<{
        name: string;
        type: string;
    }>;
    name?: string;
}>();

const emit = defineEmits(['update:model-value']);

const uniqueId = Math.random().toString(36).substring(2, 12);
/*
{
    "inputs": [
        {
            "components": [
                {
                    "internalType": "address",
                    "name": "facetAddress",
                    "type": "address"
                },
                {
                    "internalType": "enum IDiamondCut.FacetCutAction",
                    "name": "action",
                    "type": "uint8"
                },
                {
                    "internalType": "bytes4[]",
                    "name": "functionSelectors",
                    "type": "bytes4[]"
                }
            ],
            "internalType": "struct IDiamondCut.FacetCut[]",
            "name": "_diamondCut",
            "type": "tuple[]"
        }
    ],
    "name": "diamondCut",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
},
*/

// data
const rawModelValues = ref<Array<string | null>>(
    props.inputs.map(input => input.type === 'boolean' ? null : ''),
);
const parsedInputValues = ref<EvmFunctionParam[]>(new Array(props.inputs.length).fill(''));

// computed
const inputName = computed(() => {
    const types = props.inputs.map(input => input.type).join(', ');

    return `${props.name ?? 'tuple'} [${types}]`;
});

const components = computed(() => props.inputs.map((input, index) => {
    const extraBindings = getExtraBindingsForInputComponent(input.type, input.name, index);
    return {
        bindings: {
            ...extraBindings,
            modelValue: rawModelValues.value[index] ?? extraBindings.defaultModelValue,
        },
        is: getComponentForInputType(input.type),
        inputType: input.type,
        handleModelValueChange: (type: string, index: number, value: string) => handleModelValueChange(type, index, value),
        handleValueParsed: (type: string, index: number, value: EvmFunctionParam) => handleValueParsed(type, index, value),
    };
}));

// watchers
watch(parsedInputValues, () => {
    const tuple = [...parsedInputValues.value];
    emit('update:model-value', tuple);
}, { deep: true });

// methods
function handleModelValueChange(type: string, index: number, value: string) {
    rawModelValues.value[index] = value;

    if (!inputRequiresParsing(type)) {
        parsedInputValues.value[index] = value;
    }
}

function handleValueParsed(type: string, index: number, value: EvmFunctionParam) {
    if (inputRequiresParsing(type)) {
        parsedInputValues.value[index] = value;
    }
}
</script>

<template>
<q-card flat bordered>
    <div class="q-pa-md">
        <div class="row">
            <div class="col-12 text-grey">
                {{ inputName }}
            </div>
        </div>

        <div
            v-for="(component, index) in components"
            :key="`tuple-${uniqueId}-component-${index}`"
            class="row"
        >
            <div class="col-12">
                <component
                    :is="component.is"
                    v-if="component.is"
                    :key="index"
                    v-bind="component.bindings"
                    required="true"
                    class="q-pb-lg"
                    @valueParsed="component.handleValueParsed(component.inputType, index, $event)"
                    @update:modelValue="component.handleModelValueChange(component.inputType, index, $event)"
                />
            </div>
        </div>
    </div>
</q-card>
</template>

<style lang="scss">
</style>
