import { EvmABI } from '.';

export const stlosAbiDeposit: EvmABI = [
    {
        constant: false,
        inputs: [],
        name: 'depositTLOS',
        outputs: [],
        payable: true,
        stateMutability: 'payable',
        type: 'function',
    },
];

export const stlosAbiWithdraw: EvmABI = [
    {
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'assets',
                type: 'uint256',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'receiver',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
        ],
        name: 'withdraw',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
];



export const stlosAbiPreviewRedeem: EvmABI = [
    {
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'shares',
                type: 'uint256',
            },
        ],
        name: 'previewRedeem',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

export const stlosAbiPreviewDeposit: EvmABI = [
    {
        inputs: [
            {
                indexed: false,
                internalType: 'uint256',
                name: 'assets',
                type: 'uint256',
            },
        ],
        name: 'previewDeposit',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
];

