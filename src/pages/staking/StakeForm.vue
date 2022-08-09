<template>
<base-staking-form
    :header="header"
    :subheader="subheader"
    :top-input-label="topInputLabel"
    :top-input-info-text="topInputInfoText"
    :top-input-amount="topInputAmount"
    :top-input-max-value="topInputMaxValue"
    :top-input-error-text="topInputErrorText"
    :top-input-is-loading="topInputIsLoading"
    :bottom-input-label="bottomInputLabel"
    :bottom-input-amount="bottomInputAmount"
    :bottom-input-max-value="bottomInputMaxValue"
    :bottom-input-is-loading="bottomInputIsLoading"
    :cta-text="ctaText"
    :cta-disabled="ctaIsDisabled"
    @input-top="handleInputTop"
    @input-bottom="handleInputBottom"
    @cta-clicked="handleCtaClick"
/>
</template>

<script>
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { debounce } from 'lodash';

import BaseStakingForm from 'pages/staking/BaseStakingForm';

import { triggerLogin } from 'components/ConnectButton';
import { WEI_PRECISION } from 'src/lib/utils';

export default {
    name: 'StakeForm',
    components: {
        BaseStakingForm,
    },
    data: () => ({
        stlosContract: null,
        header: 'Stake TLOS',
        subheader: 'Staked sTLOS provide you with access to a steady income and access to our Defi applications',
        topInputLabel: 'Stake TLOS',
        topInputAmount: '0',
        bottomInputMaxValue: null,
        topInputIsLoading: false,
        bottomInputIsLoading: false,
        bottomInputLabel: 'Receive sTLOS',
        bottomInputAmount: '0',
        maxDeposit: null,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn']),
        topInputMaxValue() {
            return this.isLoggedIn ? this.usableWalletBalance : null;
        },
        usableWalletBalance() {
            const walletBalanceWeiBn = BigNumber.from(this.maxDeposit ?? '0');
            const reservedForGas = BigNumber.from('10').pow(WEI_PRECISION);

            // eztodo update low balance logic here
            if (walletBalanceWeiBn.lte(reservedForGas))
                return '0'

            return walletBalanceWeiBn.sub(reservedForGas).toString();
        },
        topInputInfoText() {
            if (!this.isLoggedIn)
                return '';

            let balanceEth = ethers.utils.formatEther(this.usableWalletBalance);

            if (balanceEth.indexOf('.') >= 0) {
                const [integer, fraction] = balanceEth.split('.');

                balanceEth = integer.concat(`.${fraction.slice(0, 3)}`);
            }

            // eztodo update low balance here
            const balanceTLOS = ethers.utils.commify(balanceEth);

            return `${balanceTLOS} Available`;
        },
        topInputErrorText() {
            return this.isLoggedIn ? '' : 'Wallet not connected';
        },
        ctaIsDisabled() {
            return this.topInputIsLoading ||
                this.bottomInputIsLoading ||
                (
                    this.isLoggedIn &&
                    [this.topInputAmount, this.bottomInputAmount].some(amount => ['0', '', null, undefined].includes(amount))
                );
        },
        ctaText() {
            return this.isLoggedIn ? 'Stake' : 'Connect Wallet';
        },
    },
    watch: {
        address: {
            immediate: true,
            handler(address, oldAddress) {
                if (address !== oldAddress) {
                    if (address)
                        this.setMaxDeposit();
                    else
                        this.maxDeposit = null;
                }
            },
        },
    },
    created() {
        this.$contractManager.getContract(process.env.STLOS_CONTRACT_ADDRESS)
            .then(contract => {
                this.stlosContract = contract.getContractInstance();
            })
            .catch(e => {
                console.error(`Failed to get sTLOS contract instance: ${e.message}`);
            });
    },
    methods: {
        handleInputTop(newWei = '0') {
            if (newWei === this.topInputAmount)
                return;

            this.bottomInputIsLoading = true;
            this.topInputAmount = newWei;

            debounce(
                () => this.convertTlosToStlos(this.topInputAmount)
                    .then(amount => this.bottomInputAmount = amount)
                    .catch(err => {
                        this.bottomInputAmount = '';
                        console.error(err);
                    })
                    .finally(() => this.bottomInputIsLoading = false),
                750,
            )();
        },
        handleInputBottom(newWei = '0') {
            if (newWei === this.bottomInputAmount)
                return;

            this.topInputIsLoading = true;
            this.bottomInputAmount = newWei;

            debounce(
                () => this.convertStlosToTlos(this.bottomInputAmount)
                    .then(amount => this.topInputAmount = amount)
                    .catch(err => {
                        this.topInputAmount = '';
                        console.error(err);
                    })
                    .finally(() => this.topInputIsLoading = false),
                750,
            )();
        },
        handleCtaClick() {
            if (!this.isLoggedIn)
                triggerLogin();
        },
        convertTlosToStlos(wei) {
            return this.stlosContract.previewDeposit(wei).then(bigNum => bigNum.toString());
        },
        convertStlosToTlos(wei) {
            return this.stlosContract.previewRedeem(wei).then(bigNum => bigNum.toString());
        },
        setMaxDeposit() {
            this.$evm.telos.getEthAccount(this.address)
                .then(account => {
                    this.maxDeposit = account.balance.toString();
                })
                .catch(e => {
                    console.error(`Failed to get user EVM account balance: ${e.message}`);
                });
        },
    },
}
</script>

<style lang="scss">
</style>
