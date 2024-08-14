export interface AbiFunction {
    type: string;
    stateMutability: string;
    name: string;
}

export interface InputDescription {
    type: string;
    name: string;
    internalType: string;
    components?: InputDescription[];
}
