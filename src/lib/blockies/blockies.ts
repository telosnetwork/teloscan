import { createIcon } from '@download/blockies';

export const createIconFromData = (data: string) => {
    // https://github.com/download13/blockies
    const imgData = createIcon({
        seed: data,
        size: 8,
        scale: 3,
    }).toDataURL();
    return imgData;
};
