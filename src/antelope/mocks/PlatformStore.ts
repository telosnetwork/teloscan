/* eslint-disable max-len */
// Mocking PlatformStore -----------------------------------
const PlatformStore = {
    isBrowser: false,
    isBraveBrowser: false,
    isIOSMobile: false,
    isMobile: false,
};

// detect brave browser
const type_navegator = navigator as unknown as { brave?:{isBrave:()=>Promise<boolean>} };
if (type_navegator.brave) {
    type_navegator.brave.isBrave().then((isBrave) => {
        PlatformStore.isBraveBrowser = isBrave;
    });
}

// detect mobile
const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;
PlatformStore.isMobile = (mobileRegex.test(navigator.userAgent));
PlatformStore.isIOSMobile = ((/iPhone|iPad|iPod/i).test(navigator.userAgent));

export const usePlatformStore = () => PlatformStore;
