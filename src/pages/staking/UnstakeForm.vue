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
        Unstake successful! View Transaction:
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

export default {
    name: 'UnstakeForm',
    components: {
        BaseStakingForm,
        TransactionField,
    },
    props: {
        stlosContractInstance: {
            type: Object,
            required: true,
        },
        escrowContractInstance: {
            type: Object,
            required: true,
        },
        stlosBalance: {
            type: String,
            default: null,
        },
        unlockedTlosBalance: {
            type: String,
            default: null,
        },
        unstakePeriodSeconds: {
            type: Number,
            default: null,
        },
        deposits: {
            type: Array,
            default: ()=>{ return [] },
        },
    },
    data: () => ({
        resultHash: null,
        header: 'Unstake sTLOS',
        subheader: 'Redeem matured sTLOS in exchange for TLOS',
        topInputLabel: 'Unstake sTLOS',
        topInputAmount: '0',
        topInputIsLoading: false,
        bottomInputMaxValue: null,
        bottomInputIsLoading: false,
        bottomInputLabel: 'Receive TLOS',
        bottomInputAmount: '0',
        ctaIsLoading: false,
        debouncedTopInputHandler: null,
        debouncedBottomInputHandler: null,
        columns: [
            {
                name: 'amount',
                label: 'Amount',
                align: 'left',
                field: 'amount',
                format: (val) => { return ethers.utils.formatEther(val.toString());},
            },
            {
                name: 'time',
                label: 'Time Remaining',
                align: 'left',
                field: 'until',
                format: (val) => { return val.toString();},
            },
        ],
        loading: false,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn']),
        topInputMaxValue() {
            return this.isLoggedIn ? this.stakedBalance : null;
        },

        stakedBalance() {
            return BigNumber.from(this.stlosBalance ?? '0').toString();
        },

        topInputInfoText() {
            if (!this.isLoggedIn)
                return '';

            let balanceEth = ethers.utils.formatEther(this.stakedBalance);

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

            return this.isLoggedIn ? 'Unstake sTLOS' : 'Connect Wallet';
        },
    },
    async created() {
        const debounceWaitMs = 250;

        this.debouncedTopInputHandler = debounce(
            () => {
                this.stlosContractInstance.previewRedeem(this.topInputAmount)
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
                this.stlosContractInstance.previewDeposit(this.bottomInputAmount)
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

            this.stlosContractInstance.withdraw(value, this.address, this.address)
                .then((result) => {
                    this.resultHash = result.hash;
                    this.$emit('balance-changed');
                })
                .catch(({ message }) => {
                    console.error(`Failed to unstake sTLOS: ${message}`);
                    this.resultHash = null;
                })
                .finally(() => {
                    this.ctaIsLoading = false;
                });
        },
    },
}
</script>

<style lang="sass">
.deposits-container
    margin: auto
</style>
