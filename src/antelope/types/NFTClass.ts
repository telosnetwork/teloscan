/* eslint-disable max-len */
// NFT interfaces ---------------

import { IndexerNftContract, IndexerNftItemAttribute, IndexerNftItemResult } from 'src/antelope/types';

export interface NftAttribute {
    label: string;
    text: string;
}

// NFT which has been processed for display in the UI
export interface ShapedNFT {
    name: string;
    id: string;
    description?: string;
    ownerAddress: string;
    contractAddress: string;
    contractPrettyName?: string;
    attributes: NftAttribute[];
    imageSrcFull?: string; // if this is empty, the UI will display a generic image icon
    imageSrcIcon?: string; // as a result of shaping, this will always have a value if imageSrcFull is defined

    // only one of audioSrc or videoSrc should be present, not both
    audioSrc?: string;

    // during the shaping process, if there is a video but no image given in the metadata,
    // the first frame of the video should be extracted and set as the imageSrcFull & imageSrcIcon
    videoSrc?: string;
}

export type NftSourceType = 'image' | 'video' | 'audio' | 'unknown';
export const NFTSourceTypes: Record<string, NftSourceType> = {
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    UNKNOWN: 'unknown',
};

export type NftTokenInterface = 'ERC721' | 'ERC1155';

// NFT classes ------------------

export class NFTContractClass {
    indexer: IndexerNftContract;
    constructor(
        source: IndexerNftContract,
    ) {
        this.indexer = source;
    }

    get address(): string {
        return this.indexer.address;
    }

    get name(): string | undefined {
        return this.indexer.calldata?.name;
    }
}

export class NFTItemClass {
    indexer: IndexerNftItemResult;
    ready = true;
    preview: string;
    type: NftSourceType;
    source: string | undefined;
    contract: NFTContractClass;

    constructor(
        item: IndexerNftItemResult,
        public _contract: NFTContractClass,
    ) {
        this.contract = _contract;
        this.indexer = item;
        const { preview, type, source } = this.extractMetadata();
        this.preview = preview;
        this.type = type as NftSourceType;
        this.source = source;
    }

    extractMetadata():  { preview:string, type:string, source:string | undefined } {
        let type = NFTSourceTypes.IMAGE;
        let preview = '';
        let source: string | undefined = undefined;

        // We are going to test the imageCache URL to see if it is a valid URL
        if (this.indexer.imageCache) {

            // first we create a regExp for the valid URL. e.g: "https://nfts.telos.net/40/0x552fd5743432eC2dAe222531e8b88bf7d2410FBc/344"
            const regExp = new RegExp('^(https?:\\/\\/)?' + // protocol
                '(nfts.telos.net\\/)' + // domain name
                '(\\d+\\/)' + // chain id
                '(0x[0-9a-fA-F]+\\/)' + // contract address
                '(\\d+)$'); // token id

            // then we test the imageCache URL against the regExp
            const match = regExp.test(this.indexer.imageCache);
            if (match) {
                // we return the 1440.webp version of it
                preview = this.indexer.imageCache.concat('/1440.webp');
            }
        }
        // if there's an image in the metadata, we return that
        if (!preview && this.indexer.metadata?.image) {
            preview = this.indexer.metadata.image as string;
        }

        if (!preview && this.indexer.metadata) {
            // this NFT is not a simple image and could be anything (including an image).
            // We need to look at the metadata
            const metadata = this.indexer.metadata as { [key: string]: string };
            // we iterate over the metadata properties
            for (const property in metadata) {
                const value = metadata[property];
                if (!value) {
                    continue;
                }
                // if the value is a string and contains a valid url of a known media format, use it.
                // image formats: .gif, .avif, .apng, .jpeg, .jpg, .jfif, .pjpeg, .pjp, .png, .svg, .webp
                if (
                    !preview &&  // if we already have a preview, we don't need to keep looking
                    typeof value === 'string' &&
                    value.match(/\.(gif|avif|apng|jpe?g|jfif|p?jpe?g|png|svg|webp)$/)
                ) {
                    preview = value;
                }
                // audio formats: .mp3, .wav, .aac, .webm
                if (
                    !source &&  // if we already have a source, we don't need to keep looking
                    typeof value === 'string' &&
                    value.match(/\.(mp3|wav|aac|webm)$/)
                ) {
                    type = NFTSourceTypes.AUDIO;
                    source = value;
                }
                // video formats: .mp4, .webm, .ogg
                if (
                    !source &&  // if we already have a source, we don't need to keep looking
                    typeof value === 'string' &&
                    value.match(/\.(mp4|webm|ogg)$/)
                ) {
                    type = NFTSourceTypes.VIDEO;
                    source = value;
                }

                const regex = /^data:(image|audio|video)\/\w+;base64,[\w+/=]+$/;

                const match = value.match(regex);

                if (match) {
                    const contentType = match[1];

                    if (contentType === 'image' && !preview) {
                        preview = value;
                    } else if (contentType === 'audio' && !source) {
                        type = NFTSourceTypes.AUDIO;
                        source = value;
                    } else if (contentType === 'video' && !source) {
                        type = NFTSourceTypes.VIDEO;
                        source = value;
                    }
                }

            }

            // particular case of media format webm. We need to determine if it is a video or audio
            if (source && source.match(/\.webm$/)) {
                this.ready = false;

                this.determineWebmType(source).then((_type) => {
                    if (_type === NFTSourceTypes.VIDEO) {
                        this.type = NFTSourceTypes.VIDEO;
                        this.extractFirstFrameFromVideo(source as string).then((_preview) => {
                            this.preview = _preview;
                            this.ready = true;
                            this.notifyWatchers();
                        });
                    } else {
                        this.notifyWatchers();
                    }
                });
            } else {
                if (type === NFTSourceTypes.VIDEO) {
                    this.ready = false;
                    this.type = NFTSourceTypes.VIDEO;
                    this.extractFirstFrameFromVideo(source as string).then((_preview) => {
                        this.preview = _preview;
                        this.ready = true;
                        this.notifyWatchers();
                    });
                }
            }
        }

        return  { preview, type, source };
    }

    async determineWebmType(source: string): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const video = document.createElement('video');

            video.onloadedmetadata = function() {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    resolve(NFTSourceTypes.VIDEO);
                } else {
                    resolve(NFTSourceTypes.AUDIO);
                }
            };

            video.onerror = function(e) {
                reject({ error: e, source });
            };

            video.src = source;
        });
    }

    async extractFirstFrameFromVideo(source: string): Promise<string> {
        return this.extractFrameFromVideo(source, 0);
    }

    async extractFrameFromVideo(source: string, time: number): Promise<string> {
        // this function seams not to wer in most of the cases. It returns a transparent image
        return new Promise<string>((resolve, reject) => {
            const video = document.createElement('video');

            video.onloadedmetadata = function() {
                video.currentTime = time;

                const canvas = document.createElement('canvas');

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // let's draw the video in the canvas
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                    // now we test the color of the pixel in the middle of the canvas
                    const pixelData = ctx.getImageData((canvas.width / 2), (canvas.height / 2), 1, 1).data;
                    if (pixelData[3] === 0) {
                        // if it is transparent, it means that we don't have a preview for this video
                        resolve('');
                    } else {
                        // if the pixel is not transparent, we return the canvas as a dataURL
                        resolve(canvas.toDataURL());
                    }
                } else {
                    reject({ error: 'no context', source });
                }
            };

            video.onerror = function(e) {
                reject({ error: e, source });
            };

            video.src = source;
            video.setAttribute('crossOrigin', 'anonymous');
            video.preload = 'metadata';
            video.load();
        });
    }


    get name(): string {
        return (this.indexer.metadata?.name || '') as string;
    }

    get tokenId(): string {
        return this.indexer.tokenId;
    }

    get description(): string | undefined {
        return (this.indexer.metadata?.description) as string | undefined;
    }

    get owner(): string {
        return this.indexer.owner || this.indexer.minter;
    }

    get attributes(): NftAttribute[] {
        return ((this.indexer.metadata?.attributes || []) as IndexerNftItemAttribute[]).map(attr => ({
            label: attr.trait_type,
            text: attr.value,
        }));
    }

    get image(): string {
        return this.preview;
    }

    get icon(): string | undefined {
        return this.preview;
    }

    watchers: (() => void)[] = [];
    watch(cb: () => void): void {
        this.watchers.push(cb);
    }

    notifyWatchers(): void {
        this.watchers.forEach(w => w());
    }
}

export class NFTClass implements ShapedNFT {

    item: NFTItemClass;

    constructor(
        item: NFTItemClass,
    ) {
        this.item = item;
    }

    // API --

    // ShapedNFT support --
    get name(): string {
        return this.item.name;
    }

    get id(): string {
        return this.item.tokenId;
    }

    get description(): string | undefined {
        return this.item.description;
    }

    get ownerAddress(): string {
        return this.item.owner;
    }

    get contractAddress(): string {
        return this.item.contract.address;
    }

    get contractPrettyName(): string | undefined {
        return this.item.contract.name;
    }

    get attributes(): NftAttribute[] {
        return this.item.attributes;
    }

    get imageSrcFull(): string | undefined {
        return this.item.image;
    }

    get imageSrcIcon(): string | undefined {
        return this.item.icon;
    }

    get audioSrc(): string | undefined {
        return this.item.type === NFTSourceTypes.AUDIO ? this.item.source : undefined;
    }

    get videoSrc(): string | undefined {
        return this.item.type === NFTSourceTypes.VIDEO ? this.item.source : undefined;
    }

    getShapedNFT(): ShapedNFT {
        return {
            name: this.name,
            id: this.id,
            description: this.description,
            ownerAddress: this.ownerAddress,
            contractAddress: this.contractAddress,
            contractPrettyName: this.contractPrettyName,
            attributes: this.attributes,
            imageSrcFull: this.imageSrcFull,
            imageSrcIcon: this.imageSrcIcon,
            audioSrc: this.audioSrc,
            videoSrc: this.videoSrc,
        };
    }

    // this jey property is very usefull to provide a unique key to the v-for directive
    // because it is based on the content of the shapedNFT object
    get key(): string {
        const json = JSON.stringify(this.getShapedNFT());
        let counter = 0;
        for (let i = 0; i < json.length; i++) {
            counter += json.charCodeAt(i);
        }
        return counter.toString();
    }

    watch(cb: () => void): void {
        this.item.watch(cb);
    }
}

