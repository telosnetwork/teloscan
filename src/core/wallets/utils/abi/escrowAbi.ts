import { EvmABI } from 'src/core/wallets/utils/abi';

export const escrowAbiWithdraw: EvmABI = [
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];
