<script>
export default {
    name: 'FunctionParameter',
    props: {
        abiParam: {
            type: Object,
            default: null,
        },
        position: {
            type: String,
            default: null,
        },
    },
    data() {
        return {
            label: null,
            value: null,
            typeIcon: null,
        };
    },
    mounted() {
        this.label = `${this.abiParam.name ? this.abiParam.name : `Param ${this.position}`} (${this.abiParam.type})`;
    },
};
</script>

<template>
<div>
    <q-input v-model="value" :label="label">
        <template v-slot:prepend>
            <q-icon :name="typeIcon" />
        </template>
    </q-input>
</div>
</template>
