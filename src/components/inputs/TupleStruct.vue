<script>
import BaseTextInput from 'components/inputs/BaseTextInput';
import TupleStructInput from 'components/inputs/TupleStructInput';
import { createPlaceholderForTupleInput, inputIsComplex } from 'src/lib/function-interface-utils';
import { getComponentsForAbiInputs } from 'src/lib/function-interface-utils-ts';
import { toRaw } from 'vue';

export default {
    name: 'TupleStruct',
    components: {
        BaseTextInput,
        TupleStructInput,
    },
    emits: [
        'update:modelValue',
        'valueParsed',
    ],
    props: {
        modelValue: {
            type: Object,
            required: true,
        },
        label: {
            type: String,
            required: true,
        },
        name: {
            type: String,
            required: true,
        },
        componentDescription: {
            type: Object,
            required: false,
        },
        isRoot: {
            type: Boolean,
            required: false,
            default: false,
        },
    },
    data: () => ({
        root_: '',
        isExpanded: false,
        placeholder: '',
        fields: [],
        isVisible: false,
        animationTimer: 0,
        // eventEmittingTimer: 0, // FIXME: remove
        models: {
            inputs: []/* as string[]*/,                   // raw input values
            values: []/* as EvmFunctionParam[]*/,         // parsed input values
        },
    }),
    async created() {
        // Initialize fields with empty strings or default values
        this.fields = [...this.componentDescription.map(i => i.name)];
        console.log(`TupleStruct[${this.root}].created()`, { fields: this.fields });                                   // FIXME: remove

        // initialization of the translated texts
        this.placeholder = this.createPlaceholder(this.componentDescription);
        this.hint = this.$t('components.inputs.tuple_struct_input_hint');

        if (this.isRoot) {
            this.isExpanded = true;
        }
    },
    methods: {
        createInitialFields(componentDescription) {
            const fields = {};
            for (const field of componentDescription) {
                fields[field.name] = '';
            }
            return fields;
        },
        createPlaceholder(componentDescription) {
            return createPlaceholderForTupleInput(componentDescription);
        },
        shapedLabelType(componentDescription) {
            let result = '(';
            for (let i = 0; i < +componentDescription.length; i++) {
                if (componentDescription[i].type === 'tuple') {
                    result += `${this.shapedLabelType(componentDescription[i].components)}`;
                } else {
                    result += `${componentDescription[i].type}`;
                }
                if (i < +componentDescription.length - 1) {
                    result += ', ';
                }
            }
            result += ')';
            return result;
        },
        valueParsed(type/*: string*/, index/*: number*/, value/*: EvmFunctionParam*/, component/*: inputComponents*/) {
            console.log(`TupleStruct[${this.root}].valueParsed()`, type, index, value);                                   // FIXME: remove
            // we avoid emitting the valueParsed event if the value is not defined
            // clearTimeout(this.eventEmittingTimer); // FIXME: remove
            component.handleValueParsed(type, index, value);
            this.models.values[index] = value;
            // const propertyName = this.componentDescription[index].name;
            // const valueParsed = { ...toRaw(this.modelValue), [propertyName]: value };
            const valueParsed = this.getUpdatedModel();

            // we need to emit a correct value only if all fields are defined
            let isUndefined = this.isThereUndefinedValues(valueParsed);
            if (!isUndefined) {
                console.log(`TupleStruct[${this.root}].valueParsed`, 'emitting valueParsed');                            // FIXME: remove
                this.$emit('valueParsed', valueParsed);
            } else {
                console.log(`TupleStruct[${this.root}].valueParsed`, 'emitting valueParsed with undefined');             // FIXME: remove
                this.$emit('valueParsed', undefined);
            }
        },
        getUpdatedModel() {
            const modelValue = {};
            this.fields.forEach((field, index) => {
                const propertyName = this.componentDescription[index].name;
                const propertyValue = this.models.values[index];
                modelValue[propertyName] = toRaw(propertyValue);
            });
            return modelValue;
        },
        isThereUndefinedValues(valueParsed) {
            let isUndefined = false;
            console.assert(valueParsed, 'valueParsed is not defined');
            Object.keys(valueParsed).forEach((key) => {
                if (valueParsed[key] === undefined) {
                    isUndefined = true;
                }
            });
            return isUndefined;
        },
        handleFieldChange(type/*: string*/, index/*: number*/, input/*: string*/, component/*: inputComponents*/, inputs/*: inputComponents[]*/) {
            console.log(`TupleStruct[${this.root}].handleFieldChange()`, { type, index, input, inputs });                // FIXME: remove
            component.handleModelValueChange(type, index, input);

            const propertyName = this.componentDescription[index].name;
            this.fields[propertyName] = input;

            // if is not a complex input we can emit the valueParsed event
            if (!inputIsComplex(type)) {
                this.valueParsed(type, index, input, component);
                return;
            }
        },
    },
    computed: {
        root() {
            if (this.root_ !== '') {
                return this.root_;
            }
            let root_ = '';
            for (let i = 0; i < +this.componentDescription.length; i++) {
                if (this.componentDescription[i].type === 'tuple') {
                    root_ += this.shapedLabelType(this.componentDescription[i].components);
                } else {
                    root_ += this.componentDescription[i].type;
                }
                if (i < +this.componentDescription.length - 1) {
                    root_ += ', ';
                }
            }

            return root_;
        },
        inputComponents() {
            const components = getComponentsForAbiInputs(this.componentDescription, this.models)/* as unknown as inputComponents*/;
            return components;
        },
        shapedLabel() {
            let result = `${this.label} tuple${this.shapedLabelType(this.componentDescription)}`;
            return result;
        },
    },
    watch: {
        isExpanded() {
            clearTimeout(this.animationTimer);
            if (this.isExpanded) {
                this.isVisible = true;
            } else {
                this.animationTimer = setTimeout(() => {
                    this.isVisible = false;
                }, 500);
            }
        },
    },
};
</script>

<template>
<div class="tuple-struct">
    <q-expansion-item
        v-model="isExpanded"
        class="tuple-struct__header"
    >
        <template v-slot:header>
            <div class="tuple-struct__header-text">{{ shapedLabel }}</div>
        </template>

        <q-card
            v-if="isVisible"
            :class="{
                'tuple-struct__card--expanded-fields': isExpanded,
                'tuple-struct__card': true,
            }"
        >
            <div
                class="tuple-struct__card-content"
            >
                <div>
                    <template v-for="(component, index) in inputComponents">
                        <component
                            :is="component.is"
                            v-if="component.is"
                            :key="index"
                            v-bind="component.bindings"
                            required="true"
                            class="input-component q-pb-lg"
                            :class="{ 'last-element': index === inputComponents.length - 1 }"
                            @valueParsed="valueParsed(component.inputType, index, $event, component)"
                            @update:modelValue="handleFieldChange(component.inputType, index, $event, component, inputComponents)"
                        />
                    </template>
                </div>
            </div>
        </q-card>
    </q-expansion-item>

</div>
</template>

<style lang="scss">
.tuple-struct {
    width: 100%;

    &__header {
        &-text {
            flex-grow: 1;
            align-content: center;
            order: 2;
        }
    }

    &__header-btn {
        margin-right: 10px;
    }

    &__header-btn--expanded {
        transform: rotate(180deg);
        transition: transform 0.3s;
    }

    &__card {
        padding-top: 16px;
        padding-left: 16px;
        padding-left: 16px;
        transition: margin-right 1.3s;
    }

}
</style>
