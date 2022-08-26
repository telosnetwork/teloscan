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
            :top-input-tooltip="topInputTooltip"
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
    <q-dialog v-model="displayConfirmModal">
        <q-card>
            <q-card-section>
                <!-- eztodo check in w/ team about verbiage, wire up w/ top input & bottom input + staking period -->
                <p>
                    Continuing will stake TLOS in exchange for sTLOS.
                    sTLOS can be redeemed for TLOS at any time using the Unstake tab.
                </p>
                <p>
                    After TLOS has been unstaked, it will be locked for a period of
                    <span class="text-primary">{{ unstakePeriodPretty }}</span>,
                    after which it can be withdrawn to your account from the Claim tab.
                </p>
                Would you like to proceed?
            </q-card-section>

            <q-card-actions align="right" class="q-pb-md q-px-md">
                <q-btn
                    v-close-popup
                    flat
                    label="Cancel"
                    color="negative"
                />
                <q-btn
                    v-close-popup
                    label="Stake TLOS"
                    color="secondary"
                    text-color="black"
                    @click="initiateDeposit"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</div>
</template>

<script>
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { debounce } from 'lodash';

import { formatUnstakePeriod } from 'pages/staking/staking-utils';

import BaseStakingForm from 'pages/staking/BaseStakingForm';
import TransactionField from 'components/TransactionField';

import { triggerLogin } from 'components/ConnectButton';
import { WEI_PRECISION } from 'src/lib/utils';


const reservedForGasBn = BigNumber.from('10').pow(WEI_PRECISION);

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
        displayConfirmModal: false,
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
        unstakePeriodPretty() {
            return formatUnstakePeriod(this.unstakePeriodSeconds);
        },
        topInputMaxValue() {
            return this.isLoggedIn ? this.usableWalletBalance : null;
        },
        walletBalanceBn() {
            return BigNumber.from(this.tlosBalance ?? '0');
        },
        usableWalletBalance() {
            if (this.walletBalanceBn.lte(reservedForGasBn))
                return '0';
            return this.walletBalanceBn.sub(reservedForGasBn).toString();
        },
        topInputInfoText() {
            if (!this.isLoggedIn)
                return '';

            let balanceEth = ethers.utils.formatEther(this.usableWalletBalance);

            if (balanceEth.indexOf('.') >= 0) {
                const [integer, fraction] = balanceEth.split('.');

                balanceEth = integer.concat(`.${fraction.slice(0, 3)}`);
            }

            const balanceTlos = ethers.utils.commify(balanceEth);

            return `${balanceTlos} Available`;
        },
        topInputErrorText() {
            const walletBalanceBn = BigNumber.from(this.tlosBalance ?? '0');

            if (this.isLoggedIn) {
                if (walletBalanceBn.lt(reservedForGasBn))
                    return 'Insufficient TLOS balance to stake';
                else
                    return '';
            }

            return 'Wallet not connected';
        },
        topInputTooltip() {
            const prettyBalance = ethers.utils.formatEther(this.usableWalletBalance).toString();
            return 'Click to input full wallet balance\n\n' +
                   'Precise balance (less approximate gas fees):\n' +
                   `${prettyBalance} TLOS`;
        },
        ctaIsDisabled() {
            const inputsInvalid = (
                this.isLoggedIn &&
                [this.topInputAmount, this.bottomInputAmount].some((amount) => {
                    return BigNumber.from(amount ?? '0').eq('0');
                })
            );

            return inputsInvalid ||
                this.topInputIsLoading ||
                this.bottomInputIsLoading ||
                this.ctaIsLoading;
        },
        ctaText() {
            if (this.ctaIsLoading)
                return 'Loading...';

            const walletBalanceBn = BigNumber.from(this.tlosBalance ?? '0');

            if (this.isLoggedIn) {
                if (walletBalanceBn.lt(reservedForGasBn))
                    return 'Get more TLOS';
                else
                    return 'Stake TLOS';
            }

            return 'Connect Wallet';
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

            const walletBalanceBn = BigNumber.from(this.tlosBalance ?? '0');

            if (walletBalanceBn.lt(reservedForGasBn)) {
                // eztodo is there a better/more official way to add TLOS?
                window.open('https://www.kucoin.com/trade/TLOS-USDT', '_blank');
            }

            this.displayConfirmModal = true;
        },
        initiateDeposit() {
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
