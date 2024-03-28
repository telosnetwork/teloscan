export interface TokenBasicData {
    symbol: string;
    address: string;
    name: string;
    decimals: string;
}

export interface ERC721Transfer {
    tokenId: string;
    to: string;
    from: string;
    token: TokenBasicData;
}

export interface ERC20Transfer {
    value: string;
    wei: string;
    to: string;
    from: string;
    token: TokenBasicData;
}

export interface ERC1155Transfer {
    tokenId: string;
    amount: string;
    to: string;
    from: string;
    token: TokenBasicData;
}

export type ERCTransfer = ERC721Transfer | ERC1155Transfer | ERC20Transfer;
