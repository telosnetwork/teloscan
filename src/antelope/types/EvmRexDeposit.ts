import { ethers } from 'ethers';

export interface EvmRexDeposit {
    // amount of REX tokens deposited (expressed in system tokens - e.g. TLOS)
    amount: ethers.BigNumber;

    // a big number representing the time (seconds since epoch) at which the deposit will be available for withdrawal
    // data.until.toNumber() should be salfe to use as a timestamp
    until: ethers.BigNumber;
}
