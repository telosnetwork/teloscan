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
    return {
        [name]: {
            value: response,
            type: outputs[0].type,
        },
    } as unknown as OutputResult;
}

function processOutputResponsesArray(responses: OutputResult[], output: OutputType): OutputResult {
    const list = [] as OutputResult[];
    const tupleOutput = { ...output, type: 'tuple' } as OutputType;
    responses.forEach((response) => {
        const processed:OutputResult = processOutputResponse(response as unknown as OutputValue[], [tupleOutput]);
        list.push(processed);
    });

    return {
        [output.name || 'response']: list,
    } as unknown as OutputResult;
}

function processOutputResponse(response: OutputValue[], outputs: OutputType[]): OutputResult {
    if (response.length !== 1 && outputs.length === 1) {
        if (outputs[0].type === 'tuple') {
            if (outputs[0].components) {
                return processOutputResponse(response, outputs[0].components);
            } else {
                return processNotExpectedOutputs(response, outputs);
            }
        } else if (outputs[0].type === 'tuple[]') {
            if (outputs[0].components) {
                return processOutputResponsesArray(response as unknown as OutputResult[], outputs[0]);
            } else {
                return processNotExpectedOutputs(response, outputs);
            }
        } else {
            return processNotExpectedOutputs(response, outputs);
        }
    } else if (response.length === outputs.length) {
        return processSimpleOutputs(response, outputs);
    } else {
        return processNotExpectedOutputs(response, outputs);
    }
}

// Procesar la respuesta
const processedResponse = ref<OutputResult>({});

function isBasicTypeResponse(output: OutputResult, indentLevel: number): boolean {
    let isSimple = true;
    if (indentLevel > 1) {
        isSimple = false;
    } else if (Object.keys(output).length > 1) {
        isSimple = false;
    } else {
        const result = output[Object.keys(output)[0]] as OutputResult;
        if (typeof result === 'object' && result !== null && typeof result.value === 'undefined') {
            isSimple = false;
        }
    }
    return isSimple;
}

function formatBasicOutput(output: OutputResult): string {
    const data = output[Object.keys(output)[0]] as OutputData;
    if (data.type === 'address') {
        return `<a href="/address/${data.value}">${data.value}</a>`;
    } else if (data.type === 'address[]') {
        const addresses = (typeof data.value === 'string' ? [data.value] : data.value) as string[];
        return `[${addresses.map(address => `<a href="/address/${address}">${address}</a>`).join(', ')}]`;
    } else {
        if (Array.isArray(data.value)) {
            return `[${data.value.join(', ')}]`;
        } else {
            return `${data.value}`;
        }
    }
}

function formatOutput(output: OutputResult, indentLevel = 1): string {
    if (isBasicTypeResponse(output, indentLevel)) {
        return formatBasicOutput(output);
    }
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
            const addresses = (typeof data.value === 'string' ? [data.value] : data.value) as string[];
            json += `${indent}${key}: [${addresses.map(address => `<a href="/address/${address}">${address}</a>`).join(', ')}]`;
        } else {
            if (Array.isArray(data.value)) {
                json += `${indent}${key}: [${data.value.join(', ')}]`;
            } else {
                json += `${indent}${key}: ${data.value}`;
            }
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
    overflow: auto;
    @include scroll-bar;
}
</style>
