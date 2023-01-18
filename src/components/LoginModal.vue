<script>
import MetamaskLogo from 'src/assets/metamask-fox.svg'
import WombatLogo from 'src/assets/wombat-logo.png'

import { mapGetters, mapMutations, mapState } from 'vuex';
import { ethers } from 'ethers';
import { WEI_PRECISION } from 'src/lib/utils';
import { tlos } from 'src/lib/logos';

const LOGIN_EVM = 'evm';
const LOGIN_NATIVE = 'native';
const PROVIDER_WEB3_INJECTED = 'injectedWeb3'

export default {
    name: 'LoginModal',
    props: {
        show: {
            type: Boolean,
            default: false,
        },
    },
    emits: ['hide'],
    data: () => ({
        metamaskLogo: MetamaskLogo,
        tab: 'web3',
    }),
    computed: {
        ...mapGetters('login', [
            'isLoggedIn',
            'isNative',
            'address',
            'nativeAccount',
        ]),
        ...mapState('general', ['browserSupportsMetaMask']),
    },
    async mounted() {
        const loginData = localStorage.getItem('loginData');
        if (!loginData)
            return;

        const loginObj = JSON.parse(loginData);
        if (loginObj.type === LOGIN_EVM) {
            const provider = this.getInjectedProvider();
            let checkProvider = new ethers.providers.Web3Provider(provider)
            const { chainId } = await checkProvider.getNetwork();

            if(loginObj.chain === chainId){
                switch (loginObj.provider) {
                case PROVIDER_WEB3_INJECTED:
                    this.injectedWeb3Login();
                    break;
                default:
                    console.error(`Unknown web3 login type: ${loginObj.provider}`);
                    this.$q.notify({
                        position: 'top',
                        message: this.$t('components.unknown_web3_login_type', { provider: loginObj.provider }),
                        timeout: 6000,
                    });
                    break;
                }
            }
        } else if (loginObj.type === LOGIN_NATIVE) {
            const wallet = this.$ual.authenticators.find(a => a.getName() === loginObj.provider);
            this.ualLogin(wallet);
        }
    },
    methods: {
        ...mapMutations('login', [
            'setLogin',
        ]),
        getLoginDisplay() {
            return this.isNative ? this.nativeAccount : `0x...${this.address.slice(this.address.length - 4)}`;
        },
        connect() {
            this.showLogin = true;
        },
        disconnect() {
            if (this.isNative) {
                const loginData = localStorage.getItem('loginData');
                if (!loginData)
                    return;

                const loginObj = JSON.parse(loginData);
                const wallet = this.$ual.authenticators.find(a => a.getName() === loginObj.provider);
                wallet.logout();
            }

            this.setLogin({});
            localStorage.removeItem('loginData');
            this.$providerManager.setProvider(null);
        },
        goToAddress() {
            this.$router.push(`/address/${this.address}`);
        },
        async injectedWeb3Login() {
            if (!this.browserSupportsMetaMask) {
                window.open('https://metamask.app.link/dapp/teloscan.io');
                return;
            }

            const address = await this.getInjectedAddress();
            if (address) {
                this.setLogin({
                    address,
                })
                let provider = this.getInjectedProvider();
                let checkProvider = new ethers.providers.Web3Provider(provider)
                this.$providerManager.setProvider(provider);
                const { chainId } = await checkProvider.getNetwork();
                localStorage.setItem(
                    'loginData',
                    JSON.stringify({ type: LOGIN_EVM, provider: PROVIDER_WEB3_INJECTED, chain: chainId }),
                );
                provider.on('chainChanged', (newNetwork) => {
                    if(newNetwork !== chainId){
                        this.setLogin({});
                        this.$providerManager.setProvider(null);
                    }
                });
                provider.on('accountsChanged', (accounts) => {
                    this.setLogin({
                        address: accounts[0],
                    })
                })
            }
            this.$emit('hide');
        },
        async ualLogin(wallet, account) {
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
                })
                this.$providerManager.setProvider(account);
                localStorage.setItem('loginData', JSON.stringify({ type: LOGIN_NATIVE, provider: wallet.getName() }));
            }
            this.$emit('hide');
        },
        async getInjectedAddress() {
            const provider = this.getInjectedProvider();
            let checkProvider = new ethers.providers.Web3Provider(provider);

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
        async ensureCorrectChain(checkProvider) {
            const { chainId } = await checkProvider.getNetwork();
            if (chainId !== process.env.NETWORK_EVM_CHAIN_ID) {
                await this.switchChainInjected();
                const provider = this.getInjectedProvider();
                return new ethers.providers.Web3Provider(provider);
            }
        },
        getInjectedProvider() {
            const provider = window.ethereum.isMetaMask || window.ethereum.isCoinbaseWallet ?
                window.ethereum :
                null
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
                const chainId = parseInt(process.env.NETWORK_EVM_CHAIN_ID, 10);
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

                    if (chainNotAddedCodes.includes(e.code)) {  // 'Chain <hex chain id> hasn't been added'
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
        getIconForWallet(wallet) {
            if (wallet.getName() === 'wombat') {
                // Wombat UAL logo is 32x32px; substitute for higher res
                return WombatLogo;
            }

            return wallet.getStyle().icon;
        },
    },
}
</script>
<template>
<div class="c-login-modal">
    <q-dialog :model-value="show" @hide="() => $emit('hide')">
        <q-card rounded class="c-login-modal__modal-inner">
            <q-tabs v-model="tab">
                <q-tab name="web3" :label="$t('components.evm_wallets')"></q-tab>
                <q-tab name="native" :label="$t('components.advanced')"></q-tab>
            </q-tabs>
            <q-separator/>
            <q-tab-panels v-model="tab" animated>
                <q-tab-panel name="web3">
                    <q-card class="c-login-modal__image-container" @click="injectedWeb3Login()">
                        <q-img
                            :src="metamaskLogo"
                            class="wallet-img"
                            height="64px"
                            width="64px"
                        />
                        <p>{{ !browserSupportsMetaMask ? $t('components.continue_on_metamask') : 'Metamask' }}</p>
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
                            class="c-login-modal__image-container"
                            v-for="wallet in $ual.authenticators"
                            :key="wallet.getStyle().text"
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
        padding: 12px;
        margin: 8px;

        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;

        cursor: pointer;
    }
}


</style>
