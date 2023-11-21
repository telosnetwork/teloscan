/* eslint-disable max-len */
// NFT interfaces ---------------

import { AxiosInstance } from 'axios';
import { Contract, ethers } from 'ethers';
import {
    AntelopeError,
    GenericIndexerNft,
    INVALID_METADATA,
    IndexerNftContract,
    IndexerNftItemAttribute,
    IndexerNftMetadata,
    IndexerTokenHoldersResponse,
} from 'src/antelope/types';
import {
    CURRENT_CONTEXT,
    EVMChainSettings,
    useAccountStore,
    useChainStore,
    useContractStore,
    useNftsStore,
} from 'src/antelope/mocks';
import {
    IPFS_GATEWAY,
    extractNftMetadata,
} from 'src/antelope/wallets/utils/nft-utils';

export interface NftAttribute {
    label: string;
    text: string;
}

interface NftPrecursorData {
    name: string;
    id: string;
    metadata: IndexerNftMetadata;
    updated: number; // epoch
    owner?: string; // ERC721 only

    tokenUri?: string;
    imageCache?: string; // url
    minter?: string; // address
    blockMinted?: number;

    mediaType: NftSourceType;
    imgSrc?: string;
    videoSrc?: string;
    audioSrc?: string;
}

export type Collectible = Erc721Nft | Erc1155Nft;

export interface Erc721NftPrecursorData extends NftPrecursorData {
    owner: string;
}

export interface Erc1155NftPrecursorData extends NftPrecursorData {
    owners: { [address: string]: number };
    supply: number;
}

export type NftSourceType = 'image' | 'video' | 'audio' | 'unknown';
export const NFTSourceTypes: Record<string, NftSourceType> = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    UNKNOWN: 'unknown',
};

export type NftTokenInterface = 'ERC721' | 'ERC1155';

// used as an intermediate type for constructing NFTs from indexer data
export type NftRawData = { data: GenericIndexerNft, contract: NFTContractClass };


export async function getErc721Owner(contract: Contract, tokenId: string): Promise<string> {
    return await contract.ownerOf(tokenId);
}

export async function getErc1155OwnersFromIndexer(contractAddress: string, tokenId: string, indexer: AxiosInstance): Promise<{ [address: string]: number }> {
    const holdersResponse = (await indexer.get(`/v1/token/${contractAddress}/holders?limit=10000&token_id=${tokenId}`)).data as IndexerTokenHoldersResponse;
    const holders = holdersResponse.results;

    return holders.reduce((acc, current) => {
        acc[current.address] = +current.balance;
        return acc;
    }, {} as { [address: string]: number });
}

export async function getErc1155OwnersFromContract(ownerAddress: string, tokenId: string, contract: Contract): Promise<{ [address: string]: number }> {
    // we create a reduced list of owners containing just the balance of the current user
    // because we can't get all the owners from the contract (without a loop)
    const _owners = await contract.balanceOf(ownerAddress, tokenId).then((balance: ethers.BigNumber) => {
        const _balance = balance.toNumber();
        const _owners: { [address: string]: number } = {};
        _owners[ownerAddress] = _balance;
        return _owners;
    });
    return _owners;
}



/**
 * Construct an NFT from indexer data
 * @param contract The contract this NFT belongs to
 * @param indexerData The indexer data for this NFT
 * @returns The constructed NFT
 */
export async function constructNft(
    contract: NFTContractClass,
    indexerData: GenericIndexerNft,
    chainSettings: EVMChainSettings,
    contractStore: ReturnType<typeof useContractStore>,
    nftStore: ReturnType<typeof useNftsStore>,
): Promise<Erc721Nft | Erc1155Nft> {
    const network = chainSettings.getNetwork();

    const isErc721 = contract.supportedInterfaces.includes('erc721');
    const isErc1155 = contract.supportedInterfaces.includes('erc1155');

    if (!isErc721 && !isErc1155) {
        throw new AntelopeError('antelope.contracts.error_invalid_nft_contract_type');
    }

    const cachedNft = nftStore.__contracts[network]?.[contract.address]?.list.find(nft => nft.id === indexerData.tokenId);

    if (cachedNft) {
        await cachedNft.updateOwnerData();
        return cachedNft;
    }

    try {
        if (indexerData.metadata !== INVALID_METADATA) {
            indexerData.metadata = typeof indexerData.metadata === 'string' ? JSON.parse(indexerData.metadata) : indexerData.metadata;
        } else {
            indexerData.metadata = {};
        }
    } catch (e) {
        console.error('Error parsing metadata', `"${indexerData.metadata}"`, e);
    }
    if (!indexerData.metadata || typeof indexerData.metadata !== 'object') {
        // we create a new metadata object with the actual string attributes of the item
        const list = indexerData as unknown as { [key: string]: unknown };
        indexerData.metadata =
            Object.keys(indexerData)
                .filter(k => typeof list[k] === 'string')
                .reduce((obj, key) => {
                    obj[key] = list[key] as string;
                    return obj;
                }, {} as { [key: string]: string });
    }

    indexerData.metadata.image = ((indexerData.metadata.image as string) ?? '').replace('ipfs://', IPFS_GATEWAY);

    const { image, mediaType, mediaSource } = await extractNftMetadata(indexerData.imageCache ?? '', indexerData.tokenUri ?? '', indexerData.metadata ?? {});
    const commonData: NftPrecursorData = {
        name: (indexerData.metadata?.name ?? '') as string,
        id: indexerData.tokenId,
        metadata: indexerData.metadata,
        minter: indexerData.minter,
        tokenUri: indexerData.tokenUri,
        imageCache: indexerData.imageCache,
        blockMinted: indexerData.blockMinted,
        updated: indexerData.updated,
        mediaType,
        imgSrc: image,
        videoSrc: mediaType === NFTSourceTypes.VIDEO ? mediaSource : undefined,
        audioSrc: mediaType === NFTSourceTypes.AUDIO ? mediaSource : undefined,
        owner: indexerData.owner,
    };

    if (isErc721) {
        const contractInstance = await (await contractStore.getContract(CURRENT_CONTEXT, contract.address, 'erc721'))?.getContractInstance();

        if (!contractInstance) {
            throw new AntelopeError('antelope.utils.error_contract_instance');
        }

        const owner = commonData.owner ?? await getErc721Owner(contractInstance, indexerData.tokenId);

        return new Erc721Nft({
            ...commonData,
            owner,
        }, contract);
    }

    const indexer = chainSettings.getIndexer();
    const owners = await getErc1155OwnersFromIndexer(contract.address, indexerData.tokenId, indexer);

    return new Erc1155Nft({
        ...commonData,
        owners,
        supply: indexerData.supply as number,
    }, contract);
}

// NFT classes ------------------

export class NFTContractClass {
    indexer: IndexerNftContract;
    constructor(source: IndexerNftContract) {
        this.indexer = source;
    }

    get address(): string {
        return this.indexer.address;
    }

    get name(): string | undefined {
        return this.indexer.calldata?.name;
    }

    get supportedInterfaces() {
        return this.indexer.supportedInterfaces?.map(iface => iface.toLowerCase()) ?? [];
    }
}

// use constructNft method to build an NFT from indexer data
class NFT {
    protected contract: NFTContractClass;

    readonly name: string;
    readonly id: string;
    readonly metadata: IndexerNftMetadata;
    readonly contractAddress: string; // address
    readonly updated: number; // epoch
    readonly attributes: NftAttribute[];
    readonly mediaType: NftSourceType;

    readonly contractPrettyName?: string;
    readonly description?: string;
    readonly tokenUri?: string;
    readonly minter?: string; // address
    readonly blockMinted?: number; // the block number when this NFT was minted
    readonly imgSrc?: string;
    readonly audioSrc?: string;
    readonly videoSrc?: string;

    readonly ownerDataLastFetched: number; // ms since epoch since the owner(s) was last updated

    constructor(
        precursorData: NftPrecursorData,
        contract: NFTContractClass,
    ) {
        this.contract = contract;
        this.contractAddress = contract.address;
        this.contractPrettyName = contract.name;

        this.name = precursorData.name;
        this.id = precursorData.id;
        this.metadata = precursorData.metadata;
        this.minter = precursorData.minter;
        this.tokenUri = precursorData.tokenUri;
        this.blockMinted = precursorData.blockMinted;
        this.updated = precursorData.updated;
        this.description = precursorData.metadata?.description;
        this.mediaType = precursorData.mediaType;
        this.imgSrc = precursorData.imgSrc;
        this.audioSrc = precursorData.audioSrc;
        this.videoSrc = precursorData.videoSrc;

        this.ownerDataLastFetched = Date.now();

        this.attributes = ((precursorData.metadata?.attributes || []) as IndexerNftItemAttribute[]).map(attr => ({
            label: attr.trait_type,
            text: attr.value,
        }));
    }

    // this key property is useful when used as a key for the v-for directive
    get key(): string {
        return `nft-${this.contractAddress}-${this.id}`;
    }
}

export class Erc721Nft extends NFT {
    private _owner: string;

    constructor(
        precursorData: Erc721NftPrecursorData,
        contract: NFTContractClass,
    ) {
        super(precursorData, contract);
        this._owner = precursorData.owner;
    }

    set owner(owner: string) {
        this._owner = owner;
    }

    get owner(): string {
        return this._owner;
    }

    async updateOwnerData(): Promise<void> {
        const contract = await useContractStore().getContract(CURRENT_CONTEXT, this.contractAddress);
        const contractInstance = await contract?.getContractInstance();

        if (!contractInstance) {
            throw new AntelopeError('antelope.utils.error_contract_instance');
        }

        this._owner = await getErc721Owner(contractInstance, this.id);
    }
}

export class Erc1155Nft extends NFT {
    private _owners: { [address: string]: number };

    readonly supply: number;

    constructor(
        precursorData: Erc1155NftPrecursorData,
        contract: NFTContractClass,
    ) {
        super(precursorData, contract);
        this._owners = precursorData.owners;
        this.supply = precursorData.supply;
    }

    set owners(owners: { [address: string]: number }) {
        this._owners = owners;
    }

    get owners(): { [address: string]: number } {
        return this._owners;
    }


    async updateOwnerData(): Promise<void> {
        const chainSettings = (useChainStore().currentChain.settings as EVMChainSettings);
        if (chainSettings.isIndexerHealthy()) {
            const indexer = chainSettings.getIndexer();
            this._owners = await getErc1155OwnersFromIndexer(this.contractAddress, this.id, indexer);
        } else {
            const account = useAccountStore().getAccount(CURRENT_CONTEXT);
            const contract = await useContractStore().getContract(CURRENT_CONTEXT, this.contractAddress);
            const contractInstance = await contract?.getContractInstance();

            if (!contractInstance) {
                throw new AntelopeError('antelope.utils.error_contract_instance');
            }

            const updated_owners = await getErc1155OwnersFromContract(account.account, this.id, contractInstance);
            this._owners = { ...this._owners, ...updated_owners };
        }
    }
}
