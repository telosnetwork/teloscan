<script lang="ts" setup>
import { useQuasar } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import detectEthereumProvider from '@metamask/detect-provider';
import { Authenticator } from 'universal-authenticator-library';

import {
    LOGIN_EVM,
    LOGIN_NATIVE,
    PROVIDER_WALLET_CONNECT,
    PROVIDER_BRAVE,
    PROVIDER_METAMASK,
    LOGIN_DATA_KEY,
} from 'src/lib/utils';
import {
    AccountModel,
    CURRENT_CONTEXT,
    EvmAccountModel,
    getAntelope,
    useAccountStore,
    useChainStore,
} from 'src/antelope/mocks';
import { ual } from 'src/boot/ual';
import { providerManager } from 'src/boot/evm';

const $q = useQuasar();
const store = useStore();
const { t: $t } = useI18n();

const props = withDefaults(defineProps<{show?: boolean}>(), {
    show: false,
});

const emit = defineEmits(['hide']);

const tab = ref('web3');
const isMobile = ref(false);
const browserSupportsMetaMask = ref(true);
const isBraveBrowser = ref(false);
const isIOSMobile = ref(false);

const authenticators = computed(() => ual.getAuthenticators().availableAuthenticators);

onMounted(async () => {
    await detectProvider();
    detectMobile();

    // On login we must set the address and record the provider
    getAntelope().events.onLoggedIn.subscribe((account: AccountModel) => {
        const evm_account = account as EvmAccountModel;
        const address = evm_account.account;
        const pr_name = evm_account.authenticator.getName();
        setLogin({ address });

        localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify({
            type: LOGIN_EVM,
            provider: pr_name,
            account: address,
        }));
    });

    const loginData = localStorage.getItem(LOGIN_DATA_KEY);
    if (!loginData) {
        return;
    }

    const loginObj = JSON.parse(loginData);
    if (loginObj.type === LOGIN_EVM) {
        loginWithAntelope(loginObj.provider, loginObj.account);
    } else if (loginObj.type === LOGIN_NATIVE) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wallet = authenticators.value.find((a: { getName: () => any; }) => a.getName() === loginObj.provider);
        if (wallet) {
            ualLogin(wallet);
        } else {
            console.error(`Unknown login type: ${loginObj.type}`);
            $q.notify({
                position: 'top',
                message: $t('components.unknown_native_login_provider', { provider: loginObj.provider }),
                timeout: 6000,
            });
        }
    }
});

async function detectProvider() {
    const provider = await detectEthereumProvider({ mustBeMetaMask: true });
    browserSupportsMetaMask.value = provider?.isMetaMask || false;
    isBraveBrowser.value = navigator.brave && await navigator.brave.isBrave() || false;
}

function detectMobile() {
    // eslint-disable-next-line max-len
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i;
    isMobile.value = mobileRegex.test(navigator.userAgent);
    /* used for temp exclusion from Brave Browser wallet.
    See https://github.com/telosnetwork/teloscan/issues/335 */
    isIOSMobile.value = (/iPhone|iPad|iPod/i).test(navigator.userAgent);
}

function setLogin(account: { address?: string, nativeAccount?: string}){
    store.commit('login/setLogin', account);
}

async function ualLogin(wallet: Authenticator, account?: string) {
    await wallet.init();
    const users = await wallet.login(account);
    if (users.length) {
        const account = users[0];
        const accountName = await account.getAccountName();
        let evmAccount = '';
        try {
            const chain = useChainStore().currentChain;
            evmAccount = await chain.settings.getEthAccountByNativeAccount(accountName);
        } catch (e) {
            $q.notify({
                position: 'top',
                message: $t('components.search_evm_address_failed', { accountName }),
                timeout: 6000,
            });
            wallet.logout();
            return;
        }
        setLogin({
            address: evmAccount,
            nativeAccount: accountName,
        });
        providerManager.setProvider(account);
        localStorage.setItem(LOGIN_DATA_KEY, JSON.stringify({
            type: LOGIN_NATIVE,
            provider: wallet.getName(),
            account: evmAccount,
        }));
    }
    emit('hide');
}

function getIconForWallet(wallet: { getName: () => string; getStyle: () => { icon: string; }; }) {
    if (wallet.getName() === 'wombat') {
        // Wombat UAL logo is 32x32px; substitute for higher res
        return '/assets/wombat-logo.png';
    }
    return wallet.getStyle().icon;
}

async function loginWithAntelope(name:string, autoLogAccount?: string) {
    const label = CURRENT_CONTEXT;
    const auth = getAntelope().wallets.getAuthenticator(name);
    if (!auth) {
        console.error(`${name} authenticator not found`);
        return;
    }
    const authenticator = auth.newInstance(label);
    const network = useChainStore().currentChain.settings.getNetwork();
    useAccountStore().loginEVM({ authenticator, network, autoLogAccount }, true);
    emit('hide');
}

async function connectMetaMask() {
    if (isBraveBrowser.value && window.ethereum.isBraveWallet && !isMobile.value){
        $q.notify({
            position: 'top',
            message: $t('components.enable_wallet_extensions'),
            timeout: 6000,
        });
        return;
    }

    if (!browserSupportsMetaMask.value || !window.ethereum || (isMobile.value && isBraveBrowser.value)){
        try {
            window.open('https://metamask.app.link/dapp/teloscan.io');
        } catch {
            $q.notify({
                position: 'top',
                message: $t('components.enable_wallet_extensions'),
                timeout: 6000,
            });
        }
        return;
    }

    loginWithAntelope(PROVIDER_METAMASK);
}

async function connectBraveWallet() {
    // Brave Wallet is not set as default and/or has other extensions enabled
    if (!window.ethereum.isBraveWallet){
        $q.notify({
            position: 'top',
            message: $t('components.disable_wallet_extensions'),
            timeout: 6000,
        });
        return;
    }
    loginWithAntelope(PROVIDER_BRAVE);
}

function connectWalletConnect() {
    loginWithAntelope(PROVIDER_WALLET_CONNECT);
}

function hideDialog(){
    emit('hide');
}

</script>
<template>
<q-dialog :model-value="props.show" @hide="hideDialog">
    <q-card rounded class="c-login-modal__modal-inner">
        <q-tabs v-model="tab">
            <q-tab name="web3" :label="$t('components.evm_wallets')" />
            <q-tab name="native" :label="$t('components.advanced')" />
        </q-tabs>
        <q-separator/>
        <q-tab-panels v-model="tab" animated class="c-login-modal__panels">
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
    &__panels{
        .scroll{
            overflow: unset;
        }
    }
}


</style>
