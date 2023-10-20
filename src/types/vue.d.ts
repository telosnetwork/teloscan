import { AxiosInstance } from 'axios';
import { ApiClient } from 'src/antelope/types/Api';
import { ProviderManager } from 'src/boot/evm.js';
import { UAL, User } from 'universal-authenticator-library';
import { TelosEvmApi } from '@telosnetwork/telosevm-js';
import ContractManager from 'src/lib/ContractManager';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: ApiClient;
    $ual: UAL;
    $user: User;

    // taken from src/boot/evm.js
    $providerManager: ProviderManager;
    $evm: TelosEvmApi;
    $contractManager: ContractManager;
    $evmEndpoint: AxiosInstance;
  }
}
