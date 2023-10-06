/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { OreIdOptions } from 'oreid-js';
import { AntelopeWallets, OreIdAuth } from 'src/antelope/wallets';

// Mocking Antelope and Config -----------------------------------
const config = {
    notifyNeutralMessageHandler: (message: string) => void 0,
    localizationHandler: (message: string, params: Record<string, string>) => message,
};

const wallets = new AntelopeWallets();
const oreIdOptions: OreIdOptions = {
    appName: process.env.APP_NAME,
    appId: process.env.OREID_APP_ID as string,
};
wallets.addEVMAuthenticator(new OreIdAuth(oreIdOptions));



const Antelope = {
    config,
    wallets,
};

export const getAntelope = () => Antelope;
