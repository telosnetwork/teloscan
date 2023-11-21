// eslint-disable-next-line no-restricted-imports
import { EvmABI } from '.';

export const erc721MetadataAbi = [{
    'inputs': [{ 'internalType': 'uint256', 'name': 'tokenId', 'type': 'uint256' }],
    'name': 'tokenURI',
    'outputs': [{ 'internalType': 'string', 'name': '', 'type': 'string' }],
    'stateMutability': 'view',
    'type': 'function',
}] as EvmABI;
