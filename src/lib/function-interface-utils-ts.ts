import { InputComponent, inputComponents, InputDescription } from 'src/types';
import { getComponentForInputType, getExpectedArrayLengthFromParameterType, getIntegerBits, inputIsComplex, parameterIsArrayType, parameterIsIntegerType, parameterTypeIsBoolean, parameterTypeIsSignedIntArray, parameterTypeIsTupleStruct, parameterTypeIsTupleStructArray, parameterTypeIsUnsignedIntArray } from 'src/lib/function-interface-utils';
import { toRaw } from 'vue';
import { EvmFunctionParam } from 'src/core/types';

export function getComponentsForAbiInputs(inputs: InputDescription[], models: {inputs: string[], values: EvmFunctionParam[]}, isRoot: boolean): inputComponents {
    // inputs must be an array
    if (!Array.isArray(inputs)) {
        return [];
    }
    // models must be an object with a an array of values for each input (user input text, always strings)
    if (
        typeof models !== 'object' ||
        !Array.isArray(models.values)
    ) {
        return [];
    }

    const getExtraBindingsForType = (input: InputDescription, index: number) => {
        const { type, name, components } = input;
        const label = `${name ? name : `Param ${index + 1}`}`;
        const extras = {} as {[key:string]: string | InputDescription[]};

        // represents integer bits (e.g. uint256) for int types, or array length for array types
        let size = undefined;
        if (parameterIsArrayType(type)) {
            size = getExpectedArrayLengthFromParameterType(type);
        } else if (parameterIsIntegerType(type)) {
            size = getIntegerBits(type);
        } else if (parameterTypeIsTupleStruct(type) && components) {
            size = toRaw(components).length;
        }

        const result = type.match(/(\d+)(?=\[)/);
        const intSize = result ? result[0] : undefined;

        if (intSize && parameterTypeIsUnsignedIntArray(type)) {
            extras['uint-size'] = intSize;
        } else if (intSize && parameterTypeIsSignedIntArray(type)) {
            extras['int-size'] = intSize;
        } else if (parameterTypeIsTupleStruct(type) && components) {
            extras['componentDescription'] = toRaw(components);
        } else if (parameterTypeIsTupleStructArray(type) && components) {
            extras['componentDescription'] = toRaw(components);
        }

        const defaultModelValue = parameterTypeIsBoolean(type) ? null : '';

        const bindings = {
            ...extras,
            isRoot,
            label,
            size,
            modelValue: models.inputs[index] ?? defaultModelValue,
            name: label.toLowerCase(),
        };
        return bindings;
    };

    const handleModelValueChange = (type: string, index: number, value: string) => {
        models.inputs[index] = value;

        if (!inputIsComplex(type)) {
            models.values[index] = value;
        }
    };
    const handleValueParsed = (type: string, index: number, value: EvmFunctionParam) => {
        if (inputIsComplex(type)) {
            models.values[index] = value;
        }
    };

    return inputs.map((input, index) => ({
        bindings: getExtraBindingsForType(input, index),
        is: getComponentForInputType(input.type),
        inputType: input.type,
        handleModelValueChange: (type: string, index: number, value: string) => handleModelValueChange(type, index, value),
        handleValueParsed:      (type: string, index: number, value: EvmFunctionParam) => handleValueParsed(type, index, value),
    }) as unknown as InputComponent);

}


