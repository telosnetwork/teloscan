/* eslint-disable max-len */
// Mocking PlatformStore -----------------------------------
const PlatformStore = {
    isBrowser: false,
    isBraveBrowser: false,
    isIOSMobile: false,
    isMobile: false,
};

// detect brave browser
if(!process.env.SERVER){
    const type_navigator = navigator as unknown as { brave?:{isBrave:()=>Promise<boolean>} };
    if (type_navigator.brave) {
        type_navigator.brave.isBrave().then((isBrave) => {
            PlatformStore.isBraveBrowser = isBrave;
        });
    }
}

// detect mobile
const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;
PlatformStore.isMobile = (process.env.SERVER) ? false : (mobileRegex.test(navigator.userAgent));
PlatformStore.isIOSMobile = (process.env.SERVER) ? false : ((/iPhone|iPad|iPod/i).test(navigator.userAgent));

export const usePlatformStore = () => PlatformStore;
