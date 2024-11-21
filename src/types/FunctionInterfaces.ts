import { EvmFunctionParam } from 'src/antelope/types';
import { InputDescription } from 'src/types/AbiFunction';

export interface InputComponent {
    bindings: {
        [key: string]: string | InputDescription[];
    };
    is: string;
    inputType: string;
    handleModelValueChange: (type: string, index: number, value: string) => void;
    handleValueParsed: (type: string, index: number, value: EvmFunctionParam) => void;
}

export type inputComponents = InputComponent[];
