import { IndexerNftMetadata, NFTSourceTypes, NftSourceType } from 'src/antelope/types';
import { urlIsAudio, urlIsPicture, urlIsVideo } from 'src/antelope/stores/utils/media-utils';

export const IPFS_GATEWAY = 'https://ipfs.telos.net/ipfs/';

/**
 * Given an imageCache URL, tokenUri, and metadata, extract the image URL, mediaType, and mediaSource
 *
 * @param imageCache - the imageCache URL
 * @param tokenUri - the tokenUri
 * @param metadata - the NFT metadata object
 *
 * @returns {Promise<image, mediaType, mediaSource>}
 */
export async function extractNftMetadata(
    imageCache: string,
    tokenUri: string,
    metadata: IndexerNftMetadata,
): Promise<{ image: string | undefined; mediaType: NftSourceType; mediaSource: string | undefined }> {
    let mediaType: NftSourceType = NFTSourceTypes.IMAGE;
    let image = '';
    let mediaSource: string | undefined = undefined;

    let _metadata = metadata;

    if (typeof _metadata === 'string') {
        try {
            _metadata = JSON.parse(_metadata);
        } catch (error) {
            _metadata = { tokenUri };
        }
    }

    // We are going to test the imageCache URL to see if it is a valid URL
    if (imageCache) {
        // first we create a regExp for the valid URL. e.g: "https://nfts.telos.net/40/0x552fd5743432eC2dAe222531e8b88bf7d2410FBc/344"
        const regExp = new RegExp('^(https?:\\/\\/)?' + // protocol
            '(nfts.telos.net\\/)' + // domain name
            '(\\d+\\/)' + // chain id
            '(0x[0-9a-fA-F]+\\/)' + // contract address
            '(\\d+)$'); // token id

        // then we test the imageCache URL against the regExp
        const match = regExp.test(imageCache);
        if (match) {
            // we return the 1440.webp version of it
            image = imageCache.concat('/1440.webp');
        }
    }
    // if there's an image in the metadata, we return that
    if (!image && _metadata?.image && urlIsPicture(_metadata.image)) {
        image = _metadata.image as string;
    }

    if (!image && _metadata) {
        // this NFT is not a simple image and could be anything (including an image).
        // We need to look at the metadata
        // we iterate over the metadata properties
        for (const property in _metadata) {
            const _value = _metadata[property];

            if (typeof _value !== 'string') {
                continue;
            }

            const value = _value.replace('ipfs://', IPFS_GATEWAY) as string;

            // if the value is a string and contains a valid url of a known media format, use it.
            // image formats: .gif, .avif, .apng, .jpeg, .jpg, .jfif, .pjpeg, .pjp, .png, .svg, .webp
            if (
                !image &&  // if we already have a preview, we don't need to keep looking
                urlIsPicture(value)
            ) {
                image = value;
            }
            // audio formats: .mp3, .wav, .aac, .webm
            if (
                !mediaSource &&  // if we already have a source, we don't need to keep looking
                await urlIsAudio(value)
            ) {
                mediaType = NFTSourceTypes.AUDIO;
                mediaSource = value;
            }
            // video formats: .mp4, .webm, .ogg
            if (
                !mediaSource &&  // if we already have a source, we don't need to keep looking
                await urlIsVideo(value)
            ) {
                mediaType = NFTSourceTypes.VIDEO;
                mediaSource = value;
            }

            const regex = /^data:(image|audio|video)\/\w+;base64,[\w+/=]+$/;

            const match = value.match(regex);

            if (match) {
                const contentType = match[1];

                if (contentType === 'image' && !image) {
                    image = value;
                } else if (contentType === 'audio' && !mediaSource) {
                    mediaType = NFTSourceTypes.AUDIO;
                    mediaSource = value;
                } else if (contentType === 'video' && !mediaSource) {
                    mediaType = NFTSourceTypes.VIDEO;
                    mediaSource = value;
                }
            }

        }
    }

    if (!image && tokenUri && (!_metadata || Object.keys(_metadata).length === 0)) {
        // if there is no metadata, attempt to use the tokenUri
        if (await urlIsVideo(tokenUri)) {
            mediaType = NFTSourceTypes.VIDEO;
        } else if (await urlIsAudio(tokenUri)) {
            mediaType = NFTSourceTypes.AUDIO;
        }
    }

    const metadataImageIsMediaUrl = await urlIsVideo(_metadata?.image ?? '') || await urlIsAudio(_metadata?.image ?? '') || urlIsPicture(_metadata?.image ?? '');

    if (_metadata?.image?.includes(IPFS_GATEWAY) && !metadataImageIsMediaUrl) {
        mediaType = await determineIpfsMediaType(_metadata?.image);

        if (mediaType === NFTSourceTypes.IMAGE) {
            image = _metadata?.image;
        }
        mediaSource = _metadata?.image;
    }

    return { image, mediaType, mediaSource };
}


/**
 * Given an IPFS media URL, determine the media type
 * @param url - the IPFS media URL
 * @returns {Promise<NftSourceType>} - the media type
 */
export async function determineIpfsMediaType(url: string): Promise<NftSourceType> {
    try {
        const response = await fetch(url);
        const contentType = response.headers.get('Content-Type') ?? '';

        if (contentType.startsWith('image/')) {
            return NFTSourceTypes.IMAGE;
        } else if (contentType.startsWith('video/')) {
            return NFTSourceTypes.VIDEO;
        } else if (contentType.startsWith('audio/')) {
            return NFTSourceTypes.AUDIO;
        } else {
            return NFTSourceTypes.UNKNOWN;
        }
    } catch (error) {
        throw new Error('Error determining IPFS media type');
    }
}
