<template>
<div class="row">
    <div class="col-12">
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
    </div>
    <div
        v-if="resultHash"
        class="col-12"
    >
        View Transaction:
        <transaction-field :transaction-hash="resultHash" />
    </div>
</div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { debounce } from 'lodash';

import TransactionField from 'components/TransactionField';
import BaseStakingForm from 'pages/staking/BaseStakingForm';

import { triggerLogin } from 'components/ConnectButton';
import { WEI_PRECISION } from 'src/lib/utils';

export default {
    name: 'StakeForm',
    components: {
        BaseStakingForm,
        TransactionField,
    },
    data: () => ({
        header: 'Stake TLOS',
        subheader: 'Staked sTLOS provide you with access to a steady income and access to our Defi applications',
        topInputLabel: 'Stake TLOS',
        topInputAmount: '0',
        bottomInputMaxValue: null,
        topInputIsLoading: false,
        bottomInputIsLoading: false,
        bottomInputLabel: 'Receive sTLOS',
        bottomInputAmount: '0',
        debouncedTopInputHandler: null,
        debouncedBottomInputHandler: null,
        resultHash: null,
    }),
    computed: {
        ...mapState('staking', [
            'tlosBalance',
        ]),
        ...mapGetters('staking', [
            'stlosContractInstance',
            'escrowContractInstance',
        ]),
        ...mapGetters('login', ['address', 'isLoggedIn']),
        topInputMaxValue() {
            return this.isLoggedIn ? this.usableWalletBalance : null;
        },
        usableWalletBalance() {
            const walletBalanceWeiBn = BigNumber.from(this.tlosBalance ?? '0');
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
    created() {
        const debounceWaitMs = 250;

        this.debouncedTopInputHandler = debounce(
            () => {
                this.stlosContractInstance?.previewDeposit(this.topInputAmount)
                    .then(amountBigNum => this.bottomInputAmount = amountBigNum.toString())
                    .catch(({ message }) => {
                        this.bottomInputAmount = '';
                        console.error(`Unable to convert TLOS to STLOS: ${message}`);
                    })
                    .finally(() => {
                        return this.bottomInputIsLoading = false;
                    })
            },
            debounceWaitMs,
        );

        this.debouncedBottomInputHandler = debounce(
            () => {
                this.stlosContractInstance?.previewRedeem(this.bottomInputAmount)
                    .then(amountBigNum => this.topInputAmount = amountBigNum.toString())
                    .catch(({ message }) => {
                        this.topInputAmount = '';
                        console.error(`Unable to convert STLOS to TLOS: ${message}`);
                    })
                    .finally(() => {
                        this.topInputIsLoading = false;
                    })
            },
            debounceWaitMs,
        );
    },
    methods: {
        ...mapActions('staking', ['depositTlos']),
        handleInputTop(newWei = '0') {
            if (newWei === this.topInputAmount)
                return;

            this.bottomInputIsLoading = true;
            this.topInputAmount = newWei;

            this.debouncedTopInputHandler();
        },
        handleInputBottom(newWei = '0') {
            if (newWei === this.bottomInputAmount)
                return;

            this.topInputIsLoading = true;
            this.bottomInputAmount = newWei;

            this.debouncedBottomInputHandler();
        },
        async handleCtaClick() {
            if (!this.isLoggedIn) {
                // eztodo can this be switched to login store action?
                triggerLogin();
                return;
            }

            // eztodo disable CTA here during load
            this.resultHash = await this.depositTlos(this.topInputAmount);
        },
    },
}
</script>

<style lang="scss"></style>
