<script>
import MetamaskLogo from 'src/assets/metamask-fox.svg'
import { mapGetters, mapMutations } from 'vuex';
import { ethers } from "ethers";
const providersError = "More than one provider is active, disable additional providers.";
const unsupportedError ="current EVM wallet provider is not supported.";
const LOGIN_EVM = 'evm';
const LOGIN_NATIVE = 'native';
const PROVIDER_WEB3_INJECTED = 'injectedWeb3'

export default {
  name: "ConnectButton",
  data() {
    return {
      tab: 'web3',
      showLogin: false,
      metamaskLogo: MetamaskLogo
    }
  },
  mounted() {
    const loginData = localStorage.getItem("loginData");
    if (!loginData)
      return;

    const loginObj = JSON.parse(loginData);
    if (loginObj.type === LOGIN_EVM) {
      switch (loginObj.provider) {
        case PROVIDER_WEB3_INJECTED:
          this.injectedWeb3Login();
          break;
        default:
          console.error(`Unknown web3 login type: ${loginObj.provider}`);
          break;
      }
    } else if (loginObj.type === LOGIN_NATIVE) {
      const wallet = this.$ual.authenticators.find(a => a.getName() == loginObj.provider);
      this.ualLogin(wallet);
    }
  },
  computed: {
    ...mapGetters('login', [
      'isLoggedIn',
      'isNative',
      'address',
      'nativeAccount'
    ])
  },
  methods: {
    ...mapMutations('login', [
      'setLogin'
    ]),
    getLoginDisplay() {
      return this.isLoggedIn ? "Disconnect wallet" : "Connect Wallet";
    },
    connect() {
      this.showLogin = true;
    },
    disconnect() {
      if (this.isNative) {
        const loginData = localStorage.getItem("loginData");
        if (!loginData)
          return;

        const loginObj = JSON.parse(loginData);
        const wallet = this.$ual.authenticators.find(a => a.getName() == loginObj.provider);
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
      const address = await this.getInjectedAddress();
      if (address) {
        this.setLogin({
          address,
        })
        this.$providerManager.setProvider(this.getInjectedProvider());
        localStorage.setItem("loginData", JSON.stringify({type: LOGIN_EVM, provider: PROVIDER_WEB3_INJECTED}));
      }
      this.showLogin = false;
    },
    async ualLogin(wallet, account) {
      await wallet.init();
      const users = await wallet.login(account);
      if (users.length) {
        const account = users[0];
        const accountName = await account.getAccountName();
        const evmAccount = await this.$evm.telos.getEthAccountByTelosAccount(accountName);
        if (!evmAccount) {
          this.$q.notify({
            position: 'top',
            message: `Search for EVM address linked to ${this.searchTerm} native account failed.  You can create one at wallet.telos.net`,
            timeout: this.TIME_DELAY
          });
          authenticator.logout();
          return;
        }
        this.setLogin({
          address: evmAccount.address,
          nativeAccount: accountName
        })
        this.$providerManager.setProvider(account);
        localStorage.setItem("loginData", JSON.stringify({type: LOGIN_NATIVE, provider: wallet.getName()}));
      }
      this.showLogin = false;
    },
    async getInjectedAddress() {
      const provider = this.getInjectedProvider();
      const checkProvider = new ethers.providers.Web3Provider(provider);
      const accounts = await checkProvider.listAccounts();
      if (accounts.length > 0) {
        const {chainId} = await checkProvider.getNetwork();
        if (chainId !== process.env.NETWORK_EVM_CHAIN_ID) {
          await this.switchChainInjected();
        }
        return accounts[0];
      }
      return false
    },
    getInjectedProvider() {
      const provider = window.ethereum.isMetaMask || window.ethereum.isCoinbaseWallet ?
        window.ethereum :
        null
      if (!provider) {
        console.error(providersError, 'or', unsupportedError);
      }
      return provider;
    },
    async switchChainInjected() {
      const provider = this.getInjectedProvider();

      if (provider) {
        const chainId = parseInt(process.env.NETWORK_EVM_CHAIN_ID, 10);
        const chainIdParam = `0x${chainId.toString(16)}`
        const mainnet = chainId === 40;
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{chainId: chainIdParam}],
          });
          return true;
        } catch (e) {
          if (e.code === 4902) {  // "Chain <hex chain id> hasn't been added"
            try {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: chainIdParam,
                  chainName: `Telos EVM ${mainnet ? 'Mainnet' : 'Testnet'}`,
                  nativeCurrency: {
                    name: `Telos`,
                    symbol: `TLOS`,
                    decimals: 18,
                  },
                  rpcUrls: [`https://${mainnet ? 'mainnet' : 'testnet'}.telos.net/evm`],
                  blockExplorerUrls: [`https://${mainnet ? '' : 'testnet'}.teloscan.io`]
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
    }
  }
}
</script>

<template lang="pug">
  div()
    q-btn( v-if="!isLoggedIn" label="Connect Wallet" @click="connect()" )
    q-btn-dropdown( v-if="isLoggedIn" :label="`0x...${address.slice(address.length - 4)}`" )
      q-list()
        q-item( clickable v-close-popup @click="goToAddress()" )
          q-item-section()
            q-item-label() View address
        q-item( clickable v-close-popup @click="disconnect()" )
          q-item-section()
            q-item-label() Disconnect
    q-dialog( v-model="showLogin" )
      q-card( rounded )
        q-tabs( v-model="tab" )
          q-tab( name="web3" label="EVM Wallets" )
          q-tab( name="native" label="Native Wallets" )
        q-separator()
        q-tab-panels( v-model="tab" animated )
          q-tab-panel( name="web3" )
            q-card( @click="injectedWeb3Login()" )
              q-img( :src="metamaskLogo" )
              div() Metamask
          q-tab-panel( name="native" )
            q-card( v-for="(wallet, idx) in $ual.authenticators"
              :key="wallet.getStyle().text"
              @click="ualLogin(wallet)" )
              q-img( :src="wallet.getStyle().icon" )
              div() {{ wallet.getStyle().text }}
</template>