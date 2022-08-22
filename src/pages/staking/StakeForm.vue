<template>
<div class="row">
    <div class="col-12 q-mb-lg">
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
            :unstake-period-seconds="unstakePeriodSeconds"
            @input-top="handleInputTop"
            @input-bottom="handleInputBottom"
            @cta-clicked="handleCtaClick"
        />
    </div>
    <div v-if="resultHash" class="col-sm-12 col-md-6 offset-md-3">
        Stake successful! View Transaction:
        <transaction-field :transaction-hash="resultHash" />
    </div>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { debounce } from 'lodash';

import BaseStakingForm from 'pages/staking/BaseStakingForm';
import TransactionField from 'components/TransactionField';

import { triggerLogin } from 'components/ConnectButton';
import { WEI_PRECISION } from 'src/lib/utils';

// reedeem(able), locked, staked, claimable, unlocked

// stats at top:
// 1. balance (TLOS)
// 2. balance (STLOS)
// 3. TLOS equivalent of STLOS balance (aka maxWithdraw)
// 4. escrowed (locked TLOS is escrow)       ----\ = show total and breakdown of unlocked vs locked
// 5. withdrawable (unlocked TLOS in escrow) ----/


// gas is paid using account TLOS ==> unstake available balance === STLOS balance



export default {
    name: 'StakeForm',
    components: {
        BaseStakingForm,
        TransactionField,
    },
    props: {
        stlosContractInstance: {
            type: Object,
            required: true,
        },
        tlosBalance: {
            type: String,
            default: null,
        },
        unstakePeriodSeconds: {
            type: Number,
            default: null,
        },
    },
    data: () => ({
        resultHash: null,
        header: 'Stake TLOS',
        subheader: 'Staked sTLOS provide you with access to a steady income and access to our Defi applications',
        topInputLabel: 'Stake TLOS',
        topInputAmount: '0',
        topInputIsLoading: false,
        bottomInputMaxValue: null,
        bottomInputIsLoading: false,
        bottomInputLabel: 'Receive sTLOS',
        bottomInputAmount: '0',
        ctaIsLoading: false,
        debouncedTopInputHandler: null,
        debouncedBottomInputHandler: null,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn']),
        topInputMaxValue() {
            return this.isLoggedIn ? this.usableWalletBalance : null;
        },
        usableWalletBalance() {
            const walletBalanceBn = BigNumber.from(this.tlosBalance ?? '0');
            const reservedForGas = BigNumber.from('10').pow(WEI_PRECISION);

            // eztodo update low balance logic here
            if (walletBalanceBn.lte(reservedForGas))
                return '0'

            return walletBalanceBn.sub(reservedForGas).toString();
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
            const balanceTlos = ethers.utils.commify(balanceEth);

            return `${balanceTlos} Available`;
        },
        topInputErrorText() {
            return this.isLoggedIn ? '' : 'Wallet not connected';
        },
        ctaIsDisabled() {
            const inputsInvalid = (
                this.isLoggedIn &&
                [this.topInputAmount, this.bottomInputAmount].some(amount => ['0', '', null, undefined].includes(amount))
            );

            return inputsInvalid ||
                this.topInputIsLoading ||
                this.bottomInputIsLoading ||
                this.ctaIsLoading;
        },
        ctaText() {
            if (this.ctaIsLoading)
                return 'Loading...';

            return this.isLoggedIn ? 'Stake TLOS' : 'Connect Wallet';
        },
    },
    async created() {
        const debounceWaitMs = 250;

        this.debouncedTopInputHandler = debounce(
            () => {
                this.stlosContractInstance.previewDeposit(this.topInputAmount)
                    .then((amountBigNum) => {
                        this.bottomInputAmount = amountBigNum.toString();
                    })
                    .catch((err) => {
                        this.bottomInputAmount = '';
                        console.error(`Unable to convert TLOS to STLOS: ${err}`);
                    })
                    .finally(() => {
                        return this.bottomInputIsLoading = false;
                    })
            },
            debounceWaitMs,
        );

        this.debouncedBottomInputHandler = debounce(
            () => {
                this.stlosContractInstance.previewRedeem(this.bottomInputAmount)
                    .then(amountBigNum => {
                        this.topInputAmount = amountBigNum.toString();
                    })
                    .catch(err => {
                        this.topInputAmount = '';
                        console.error(`Unable to convert STLOS to TLOS: ${err}`);
                    })
                    .finally(() => {
                        this.topInputIsLoading = false;
                    })
            },
            debounceWaitMs,
        );
    },
    methods: {
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
        handleCtaClick() {
            if (!this.isLoggedIn){
                triggerLogin();
                return;
            }

            this.ctaIsLoading = true;
            const value = BigNumber.from(this.topInputAmount);

            this.stlosContractInstance['depositTLOS()']({ value })
                .then((result) => {
                    this.resultHash = result.hash;
                    this.$emit('balance-changed');
                })
                .catch(({ message }) => {
                    console.error(`Failed to deposit TLOS: ${message}`);
                    this.resultHash = null;
                })
                .finally(() => {
                    this.ctaIsLoading = false;
                });
        },
    },
}
</script>

<style lang="scss"></style>
