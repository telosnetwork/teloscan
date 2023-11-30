<!-- eslint-disable max-len -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable no-unused-vars -->
<script lang="ts">
import detectEthereumProvider from '@metamask/detect-provider';
import { defineComponent } from 'vue';
import { mapGetters, mapMutations } from 'vuex';
import { ethers } from 'ethers';
import {
    WEI_PRECISION,
    LOGIN_EVM,
    LOGIN_NATIVE,
    PROVIDER_WEB3_INJECTED,
    PROVIDER_TELOS_CLOUD,
    PROVIDER_WALLET_CONNECT,
    PROVIDER_BRAVE,
    PROVIDER_METAMASK,
    DEFAULT_CHAIN_ID,
    LOGIN_DATA_KEY,
} from 'src/lib/utils';
import { tlos } from 'src/lib/logos';
import { CURRENT_CONTEXT, getAntelope, useAccountStore, useChainStore } from 'src/antelope/mocks';
import { Authenticator } from 'universal-authenticator-library';
import InlineSvg from 'vue-inline-svg';

export default defineComponent({
    name: 'LoginModal',
    components: {
        InlineSvg,
    },
    props: {
        show: {
            type: Boolean,
            default: false,
        },
    },
    data: () => ({
        tab: 'web3',
        showLogin: false,
        isMobile: false,
        browserSupportsMetaMask: true,
        isBraveBrowser: false,
        isIOSMobile: false,
    }),
    emits: ['hide'],
    computed: {
        ...mapGetters('login', [
            'isLoggedIn',
            'isNative',
            'address',
            'nativeAccount',
        ]),
        authenticators(): Authenticator[] {
            return this.$ual.getAuthenticators().availableAuthenticators;
        },
        darkModeEnabled(): boolean {
            return localStorage.getItem('darkModeEnabled') === 'true';
        },
    },
    async mounted() {
        await this.detectProvider();
        this.detectMobile();

        const loginData = localStorage.getItem(LOGIN_DATA_KEY);
        if (!loginData) {
            return;
        }

        const loginObj = JSON.parse(loginData);
        if (loginObj.type === LOGIN_EVM) {
            this.loginWithAntelope(loginObj.provider);
        } else if (loginObj.type === LOGIN_NATIVE) {
            const wallet = this.authenticators.find((a: { getName: () => any; }) => a.getName() === loginObj.provider);
            if (wallet) {
                this.ualLogin(wallet);
            } else {
                console.error(`Unknown login type: ${loginObj.type}`);
                this.$q.notify({
                    position: 'top',
                    message: this.$t('components.unknown_native_login_provider', { provider: loginObj.provider }),
                    timeout: 6000,
                });
            }
        }
    },
    methods: {
        ...mapMutations('login', [
            'setLogin',
        ]),

        async detectProvider() {
            const provider = await detectEthereumProvider({ mustBeMetaMask: true });
            this.browserSupportsMetaMask = provider?.isMetaMask || false;
            this.isBraveBrowser = navigator.brave && await navigator.brave.isBrave() || false;
        },

        detectMobile() {
            // eslint-disable-next-line max-len
            const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;
            this.isMobile = mobileRegex.test(navigator.userAgent);
            /* used for temp exclusion from Brave Browser wallet.
               See https://github.com/telosnetwork/teloscan/issues/335 */
            this.isIOSMobile = (/iPhone|iPad|iPod/i).test(navigator.userAgent);
        },

        getLoginDisplay() {
            return this.isNative ? this.nativeAccount : `0x...${this.address.slice(this.address.length - 4)}`;
        },
        connect() {
            this.showLogin = true;
        },
        disconnect() {
            if (this.isNative) {
                const loginData = localStorage.getItem(LOGIN_DATA_KEY);
                if (!loginData) {
                    return;
                }

                const loginObj = JSON.parse(loginData);
                const wallet = this.authenticators.find((a: { getName: () => any; }) => a.getName() === loginObj.provider);
                wallet?.logout();
            }

            this.setLogin({});
            localStorage.removeItem(LOGIN_DATA_KEY);
            this.$providerManager.setProvider(null);
        },
        goToAddress() {
            this.$router.push(`/address/${this.address}`);
        },
        async injectedWeb3Login() {
            const address = await this.getInjectedAddress();

            if (address) {
                this.setLogin({
                    address,
                });
                let provider = this.getInjectedProvider();
                let checkProvider = new ethers.providers.Web3Provider(provider);
                this.$providerManager.setProvider(provider);
                const { chainId } = await checkProvider.getNetwork();
                localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify({
                    type: LOGIN_EVM,
                    provider: PROVIDER_WEB3_INJECTED,
                    chain: chainId,
                }));
                provider.on('chainChanged', (newNetwork: number) => {
                    if(newNetwork !== chainId){
                        this.setLogin({});
                        this.$providerManager.setProvider(null);
                    }
                });
                provider.on('accountsChanged', (accounts: any[]) => {
                    this.setLogin({
                        address: accounts[0],
                    });
                });
            }
            this.$emit('hide');
        },
        async ualLogin(wallet: Authenticator, account?: string) {
            await wallet.init();
            const users = await wallet.login(account);
            if (users.length) {
                const account = users[0];
                const accountName = await account.getAccountName();
                let evmAccount;
                try {
                    evmAccount = await this.$evm.telos.getEthAccountByTelosAccount(accountName);
                } catch (e) {
                    this.$q.notify({
                        position: 'top',
                        message: this.$t('components.search_evm_address_failed', { accountName }),
                        timeout: 6000,
                    });
                    wallet.logout();
                    return;
                }
                this.setLogin({
                    address: evmAccount.address,
                    nativeAccount: accountName,
                });
                this.$providerManager.setProvider(account);
                localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify({ type: LOGIN_NATIVE, provider: wallet.getName() }));
            }
            this.$emit('hide');
        },
        async getInjectedAddress() {
            const provider = this.getInjectedProvider();
            let checkProvider: ethers.providers.Web3Provider | undefined = new ethers.providers.Web3Provider(provider);

            const newProviderInstance = await this.ensureCorrectChain(checkProvider);
            if(newProviderInstance){
                checkProvider = newProviderInstance;
            }
            const accounts = await checkProvider.listAccounts();
            if (accounts.length > 0) {
                checkProvider = await this.ensureCorrectChain(checkProvider);
                return accounts[0];
            } else {
                const accessGranted = await provider.request({ method: 'eth_requestAccounts' });
                if (accessGranted.length < 1) {
                    return false;
                }

                checkProvider = await this.ensureCorrectChain(checkProvider);
                return accessGranted[0];
            }
        },
        async ensureCorrectChain(checkProvider: ethers.providers.Web3Provider) {
            const { chainId } = await checkProvider.getNetwork();
            if (+chainId !== +(process.env.NETWORK_EVM_CHAIN_ID ?? DEFAULT_CHAIN_ID)) {
                await this.switchChainInjected();
                const provider = this.getInjectedProvider();
                return new ethers.providers.Web3Provider(provider);
            }
        },
        getInjectedProvider() {
            // window.ethereum.isMetaMask includes Brave Wallet
            const provider = window.ethereum.isMetaMask || window.ethereum.isCoinbaseWallet ?
                window.ethereum :
                null;
            if (!provider) {
                this.$q.notify({
                    position: 'top',
                    message: this.$t('components.no_provider_found'),
                    timeout: 6000,
                });
            }
            return provider;
        },
        async switchChainInjected() {
            const provider = this.getInjectedProvider();

            if (provider) {
                const chainId = parseInt(process.env.NETWORK_EVM_CHAIN_ID || DEFAULT_CHAIN_ID, 10);
                const chainIdParam = `0x${chainId.toString(16)}`;
                const mainnet = chainId === 40;
                try {
                    await provider.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: chainIdParam }],
                    });
                    return true;
                } catch (e) {
                    const chainNotAddedCodes = [
                        4902,
                        -32603, // https://github.com/MetaMask/metamask-mobile/issues/2944
                    ];

                    if (chainNotAddedCodes.includes((e as {code:number}).code)) {  // 'Chain <hex chain id> hasn't been added'
                        try {
                            await provider.request({
                                method: 'wallet_addEthereumChain',
                                params: [{
                                    chainId: chainIdParam,
                                    chainName: `Telos EVM ${mainnet ? 'Mainnet' : 'Testnet'}`,
                                    nativeCurrency: {
                                        name: 'Telos',
                                        symbol: 'TLOS',
                                        decimals: WEI_PRECISION,
                                    },
                                    rpcUrls: [`https://${mainnet ? 'mainnet' : 'testnet'}.telos.net/evm`],
                                    blockExplorerUrls: [`https://${mainnet ? '' : 'testnet.'}teloscan.io`],
                                    iconUrls: [tlos],
                                }],
                            });
                            return true;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                }
            } else {
                return false;
            }
        },
        getIconForWallet(wallet: { getName: () => string; getStyle: () => { icon: string; }; }) {
            if (wallet.getName() === 'wombat') {
                // Wombat UAL logo is 32x32px; substitute for higher res
                return '/assets/wombat-logo.png';
            }

            return wallet.getStyle().icon;
        },
        async loginWithAntelope(name:string) {
            const label = CURRENT_CONTEXT;
            const auth = getAntelope().wallets.getAuthenticator(name);
            if (!auth) {
                console.error(`${name} authenticator not found`);
                return;
            }
            const authenticator = auth.newInstance(label);
            const network = useChainStore().currentChain.settings.getNetwork();
            useAccountStore().loginEVM({ authenticator, network }).then(() => {
                const address = useAccountStore().getAccount(label).account;
                this.setLogin({ address });
                localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify({
                    type: LOGIN_EVM,
                    provider: name,
                }));
            });
            this.$emit('hide');
        },
        async connectMetaMask() {
            if (this.isBraveBrowser && window.ethereum.isBraveWallet && !this.isMobile){
                this.$q.notify({
                    position: 'top',
                    message: this.$t('components.enable_wallet_extensions'),
                    timeout: 6000,
                });
                return;
            }

            if (!this.browserSupportsMetaMask || !window.ethereum || (this.isMobile && this.isBraveBrowser)){
                try {
                    window.open('https://metamask.app.link/dapp/teloscan.io');
                } catch {

                    this.$q.notify({
                        position: 'top',
                        message: this.$t('components.enable_wallet_extensions'),
                        timeout: 6000,
                    });
                }
                return;
            }

            this.loginWithAntelope(PROVIDER_METAMASK);
        },
        async connectTelosCloud() {
            this.loginWithAntelope(PROVIDER_TELOS_CLOUD);
        },
        async connectBraveWallet() {
            // Brave Wallet is not set as default and/or has other extensions enabled
            if (!window.ethereum.isBraveWallet){
                this.$q.notify({
                    position: 'top',
                    message: this.$t('components.disable_wallet_extensions'),
                    timeout: 6000,
                });
                return;
            }
            this.loginWithAntelope(PROVIDER_BRAVE);
        },
        connectWalletConnect() {
            this.loginWithAntelope(PROVIDER_WALLET_CONNECT);
        },
    },
});
</script>
<template>
<div class="c-login-modal">
    <q-dialog :model-value="show" @hide="() => $emit('hide')">
        <q-card rounded class="c-login-modal__modal-inner">
            <q-tabs v-model="tab">
                <q-tab name="web3" :label="$t('components.evm_wallets')" />
                <q-tab name="native" :label="$t('components.advanced')" />
            </q-tabs>
            <q-separator/>
            <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="web3">
                    <q-card class="c-login-modal__image-container" @click="connectMetaMask()">
                        <q-img
                            :src="require('src/assets/metamask-fox.svg')"
                            height="64px"
                            width="64px"
                        />
                        <span>
                            {{ isMobile && (!browserSupportsMetaMask || isBraveBrowser) ?
                                $t('components.continue_on_metamask') : 'Metamask' }}</span>
                    </q-card>
                    <q-card
                        v-if="isBraveBrowser && !isIOSMobile"
                        class="c-login-modal__image-container"
                        @click="connectBraveWallet()"
                    >
                        <q-img
                            :src="require('src/assets/brave_lion.svg')"
                            width="50px"
                        />
                        <span> Brave Wallet </span>
                    </q-card>
                    <q-card
                        class="c-login-modal__image-container"
                        @click="connectTelosCloud()"
                    >
                        <InlineSvg
                            :src="require('src/assets/logo--telos-cloud-wallet.svg')"
                            height="64px"
                            width="64px"
                        />
                        <span> Telos Cloud </span>
                    </q-card>
                    <q-card
                        class="c-login-modal__image-container"
                        @click="connectWalletConnect()"
                    >
                        <q-img
                            :src="require('src/assets/logo--wallet-connect.svg')"
                            height="64px"
                            width="64px"
                            fit="contain"
                        />
                        <span> Wallet Connect </span>
                    </q-card>
                </q-tab-panel>
                <q-tab-panel name="native">
                    <p>
                        {{ $t('components.text1_native_wallets') }}
                        <span class="text-red">
                            {{ $t('components.text2_advanced_users') }}
                        </span>
                        {{ $t('components.text3_or_to_recover_assets') }}
                    </p>
                    <div class="u-flex--center">
                        <q-card
                            v-for="wallet in authenticators"
                            :key="wallet.getStyle().text"
                            class="c-login-modal__image-container"
                            @click="ualLogin(wallet)"
                        >
                            <q-img
                                :src="getIconForWallet(wallet)"
                                height="64px"
                                width="64px"
                            />
                            {{ wallet.getStyle().text }}
                        </q-card>
                    </div>
                </q-tab-panel>
            </q-tab-panels>
        </q-card>
    </q-dialog>
</div>
</template>

<style lang='scss'>

.c-login-modal {
    &__modal-inner {
        min-width: 300px;
    }

    &__image-container {
        height: 128px;
        width: 128px;
        padding: 12px 6px;
        margin: 8px;

        display: inline-flex;
        align-items: center;
        justify-content: space-evenly;
        flex-direction: column;

        cursor: pointer;

        &.q-dark{
            svg path{
                fill: white;
            }
        }
    }
}


</style>
