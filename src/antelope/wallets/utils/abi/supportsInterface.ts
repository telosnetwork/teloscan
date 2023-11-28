import { EvmABI } from 'src/antelope/wallets/utils/abi';

export const supportsInterfaceAbi = [{
    'constant': true,
    'inputs': [{ 'internalType': 'bytes4', 'name': 'interfaceId', 'type': 'bytes4' }],
    'name': 'supportsInterface',
    'outputs': [{ 'internalType': 'bool', 'name': '', 'type': 'bool' }],
    'payable': false,
    'stateMutability': 'view',
    'type': 'function',
}] as EvmABI;
