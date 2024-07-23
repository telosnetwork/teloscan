<script setup lang="ts">
import { watch, defineProps, ref, toRaw } from 'vue';
import { OutputValue, OutputType, OutputResult, OutputData } from 'src/types';


const props = defineProps<{
    response: OutputValue[];
    outputs: OutputType[];
}>();

// Funciones útiles
function processSimpleOutputs(values: OutputValue[], outputs: OutputType[]): OutputResult {
    const response: OutputResult = {};
    outputs.forEach((outputType, index, list) => {
        const name = outputType.name || (list.length > 1 ? `output-${index}` : 'response');
        if (outputType.type === 'tuple') {
            response[name] = processOutputResponse(values[index] as OutputValue[], outputType.components as OutputType[]);
        } else {
            response[name] = { value: values[index], type: outputType.type };
        }
    });
    return response;
}

function processNotExpectedOutputs(response: OutputValue[], outputs: OutputType[]): OutputResult {
    const name: string = outputs[0].name || 'response';
    return { [name]: response } as unknown as OutputResult;
}

function processOutputResponse(response: OutputValue[], outputs: OutputType[]): OutputResult {
    if (outputs.length === 1 && response.length !== 1) {
        if (outputs[0].type.includes('tuple')) {
            if (outputs[0].components) {
                return processOutputResponse(response, outputs[0].components);
            } else {
                return processNotExpectedOutputs(response, outputs);
            }
        } else {
            return processNotExpectedOutputs(response, outputs);
        }
    } else if (outputs.length === response.length) {
        return processSimpleOutputs(response, outputs);
    } else {
        return processNotExpectedOutputs(response, outputs);
    }
}

// Procesar la respuesta
const processedResponse = ref<OutputResult>({});

function formatOutput(output: OutputResult, indentLevel = 1): string {
    const indent = ' '.repeat(indentLevel * 4);
    let json = '{\n';
    let first = true;

    for (const key in output) {
        const result = output[key] as OutputResult;
        const data = output[key] as OutputData;
        if (!first) {
            json += ',\n';
        }
        first = false;
        if (typeof result === 'object' && result !== null && typeof result.value === 'undefined') {
            json += `${indent}${key}: ${formatOutput(result, indentLevel + 1)}`;
        } else if (data.type === 'address') {
            json += `${indent}${key}: <a href="/address/${data.value}">${data.value}</a>`;
        } else if (data.type === 'address[]') {
            const addresses = data.value as string[];
            json += `${indent}${key}: [${addresses.map(address => `<a href="/address/${address}">${address}</a>`).join(', ')}]`;
        } else {
            json += `${indent}${key}: ${data.value}`;
        }
    }

    return json + `\n${' '.repeat(indentLevel * 4 - 4)}}${indentLevel === 1 ? '\n' : ''}`;
}

watch(props, () => {
    processedResponse.value = processOutputResponse(toRaw(props.response), toRaw(props.outputs));
}, { immediate: true });

</script>

<template>
<div class="c-function-output-viewer">
    <pre class="c-function-output-viewer__json" v-html="formatOutput(toRaw(processedResponse))"></pre>
</div>
</template>

<style lang="scss">
.c-function-output-viewer {
    &__json {
        white-space: pre-wrap;
        word-wrap: break-word;
    }
}
</style>
