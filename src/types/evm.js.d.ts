/* eslint-disable max-len */
/* eslint-disable no-unused-vars */
declare module 'src/boot/evm.js' {
    import ethers from 'ethers';
    import { User } from 'universal-authenticator-library';

    export class ProviderManager {
        setProvider(provider: ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc | User | null): void;
        getEthersProvider(): ethers.providers.Web3Provider;
        getProvider(): ethers.providers.ExternalProvider | ethers.providers.JsonRpcFetchFunc | User | null;
    }

    // ContractManager
    import EvmContract from 'src/antelope/wallets/utils/contracts/EvmContract';

    export const contractManager: {
        getContract(label: string, address:string, suspectedToken: string): Promise<EvmContract | null>;
    };
}
