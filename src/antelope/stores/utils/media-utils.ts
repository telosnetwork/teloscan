import { NFTSourceTypes, NftSourceType } from 'src/antelope/types';

/**
 * given a webm source, determine if it's audio or video
 * @param source
 * @returns NFTSourceTypes.AUDIO or NFTSourceTypes.VIDEO
 */
export async function determineWebmType(source: string): Promise<NftSourceType> {
    return new Promise((resolve, reject) => {
        // Create a video element
        const video = document.createElement('video');

        // Listen for the 'loadedmetadata' event
        video.addEventListener('loadedmetadata', () => {
            // If videoHeight or videoWidth is 0, then it's audio-only.
            if (video.videoHeight === 0 || video.videoWidth === 0) {
                resolve(NFTSourceTypes.AUDIO);
            } else {
                resolve(NFTSourceTypes.VIDEO);
            }
        });

        // Handle error
        video.addEventListener('error', () => {
            reject(new Error('Failed to load video metadata.'));
        });

        // Set the URL as the video source
        video.src = source;
    });
}

/**
 * given a url, determine if it's an image
 * @param url
 * @returns true if it's an image
 */
export function urlIsPicture(url: string): boolean {
    return Boolean(url.match(/\.(gif|avif|apng|jpe?g|jfif|p?jpe?g|png|svg|webp)$/));
}

/**
 * given a url, determine if it's audio
 * @param url
 * @returns true if it's audio
 */
export async function urlIsAudio(url: string) {
    const isNotWebm = !url.match(/\.(webm)$/);

    if (isNotWebm) {
        return Boolean(url.match(/\.(mp3|wav|aac)$/));
    }

    const type = await determineWebmType(url);

    return type === NFTSourceTypes.AUDIO;
}

/**
 * given a url, determine if it's a video
 * @param url
 * @returns true if it's video
 */
export async function urlIsVideo(url: string) {
    const isNotWebm = !url.match(/\.(webm)$/);

    if (isNotWebm) {
        return Boolean(url.match(/\.(mp4|ogg)$/));
    }

    const type = await determineWebmType(url);

    return type === NFTSourceTypes.VIDEO;
}
