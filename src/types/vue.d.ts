import { AxiosInstance } from 'axios';
import { ApiClient } from 'src/antelope/types/Api';
import { ProviderManager } from 'src/boot/evm.js';
import { User } from 'universal-authenticator-library';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
    $api: ApiClient;
    $user: User;

    // taken from src/boot/evm.js
    $providerManager: ProviderManager;
    $evmEndpoint: AxiosInstance;
  }
}
