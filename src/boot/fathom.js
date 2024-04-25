import { boot } from 'quasar/wrappers';

export default boot(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.usefathom.com/script.js';

    // VMVLEWFD for mainnet
    // HKAXCRJB for testnet
    script.dataset.site = 'ISPYEAKT';
    script.dataset.spa = 'auto';
    script.defer = true;
    document.body.appendChild(script);

    console.log('Fathom installed !!!'); // FIXME: remove this line
});

