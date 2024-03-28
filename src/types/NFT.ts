/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface MetaData {
    image?: any;
    animation_url?: any;
    animation?: any;
    animationExtension?: any;
    properties?: any;
}

export interface NFT {
    metadata: MetaData;
    tokenUri: string | null;
}

export const enum NFT_TYPE {
    ERC721 = 'erc721',
    ERC1155 = 'erc1155',
}
