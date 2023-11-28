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
}
