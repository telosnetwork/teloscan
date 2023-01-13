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
            :value-of-one-stlos-in-tlos="valueOfOneStlosInTlos"
            @input-top="handleInputTop"
            @input-bottom="handleInputBottom"
            @cta-clicked="handleCtaClick"
        />
    </div>
    <div v-if="resultHash" class="col-sm-12 col-md-6 offset-md-3">
        Unstake successful! View Transaction:
        <transaction-field :transaction-hash="resultHash" />
    </div>
    <q-dialog v-model="displayConfirmModal">
        <q-card>
            <q-card-section>
                <p>
                    Continuing will redeem sTLOS in exchange for TLOS.
                    Unstaked TLOS will remain locked for a period of
                    <span class="text-primary">{{ unstakePeriodPretty }}</span>,
                    after which it can be withdrawn to your account from the Claim tab.
                </p>
                <p v-if="remainingDeposits < 10">
                    Heads up, you may unstake <span class="text-primary">{{ remainingDeposits }}</span> more times before
                    you reach the maximum concurrent unstake actions. When you reach the maximum, you will need to claim
                    unlocked TLOS to continue unstaking. If you don't have any claimable TLOS at that time, you must
                    wait until the lock duration has elapsed before you can claim unlocked TLOS and unstake more sTLOS.
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
                    label="Unstake sTLOS"
                    color="secondary"
                    text-color="black"
                    @click="initiateUnstake"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</div>
<login-modal :show="displayLoginModal" @hide="displayLoginModal = false" />
</template>

<script>
import { getClientIsApple } from 'src/lib/utils';
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { debounce } from 'lodash';

import { formatUnstakePeriod } from 'pages/staking/staking-utils';

import BaseStakingForm from 'pages/staking/BaseStakingForm';
import TransactionField from 'components/TransactionField';

import LoginModal from 'components/LoginModal.vue';

export default {
    name: 'UnstakeForm',
    components: {
        BaseStakingForm,
        LoginModal,
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
            default: () => [],
        },
        valueOfOneStlosInTlos: {
            type: String,
            default: null,
        },
    },
    emits: ['balance-changed'],
    data: () => ({
        displayConfirmModal: false,
        displayLoginModal: false,
        resultHash: null,
        header: 'Unstake sTLOS',
        subheader: 'Unstake sTLOS in exchange for TLOS',
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
        columns: [{
            name: 'amount',
            label: 'Amount',
            align: 'left',
            field: 'amount',
            format: val => ethers.utils.formatEther(val.toString()),
        }, {
            name: 'time',
            label: 'Time Remaining',
            align: 'left',
            field: 'until',
            format: val => val.toString(),
        }],
        loading: false,
        maxDeposits: null,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn', 'isNative']),
        unstakePeriodPretty() {
            return formatUnstakePeriod(this.unstakePeriodSeconds);
        },
        topInputMaxValue() {
            return this.isLoggedIn ? this.stakedBalance : null;
        },
        topInputTooltip() {
            const prettyBalance = ethers.utils.formatEther(this.stakedBalance).toString();
            return 'Click to input full staked balance\n\n' +
                'Precise balance (less approximate gas fees):\n' +
                `${prettyBalance} sTLOS`;
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

            const balanceTlos = ethers.utils.commify(balanceEth);

            return `${balanceTlos} Available`;
        },
        topInputErrorText() {
            if(this.isLoggedIn && !this.isNative) return;
            return this.isNative ? 'Login using an EVM wallet' : 'Wallet not connected';
        },
        canDeposit() {
            return this.deposits.length < this.maxDeposits;
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
        remainingDeposits() {
            return (this.maxDeposits ?? 0) - this.deposits.length;
        },
    },
    async created() {
        try {
            this.maxDeposits = (await this.escrowContractInstance.maxDeposits()).toNumber();
        } catch (error) {
            console.error(`Failed to fetch max deposits from escrow contract: ${error}`);
            this.maxDeposits = null;
        }

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
                    .finally(async () => {
                        this.bottomInputIsLoading = false;

                        if (getClientIsApple()) {
                            // workaround; Apple devices will focus the last input which had its value
                            // programmatically changed. Focus should not change. Downside is that cursor position
                            // is lost, but generally cursor should be at the end anyway
                            const old = this.topInputAmount;
                            this.topInputAmount = '0';
                            await this.$nextTick();

                            this.topInputAmount = old;
                        }
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
                    .finally(async () => {
                        this.topInputIsLoading = false;

                        if (getClientIsApple()) {
                            // workaround; Apple devices will focus the last input which had its value
                            // programmatically changed. Focus should not change. Downside is that cursor position
                            // is lost, but generally cursor should be at the end anyway
                            const old = this.bottomInputAmount;
                            this.bottomInputAmount = '0';
                            await this.$nextTick();

                            this.bottomInputAmount = old;
                        }
                    })
            },
            debounceWaitMs,
        );
    },
    methods: {
        notifyMaxDeposits(){
            this.$q.notify({
                position: 'top',
                message: 'You have reached the maximum number of pending unstake transactions, please claim available' +
                    ' TLOS or wait for pending unstaked TLOS to become claimable before making another deposit.',
                timeout: 6000,
            });
        },
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
                this.displayLoginModal = true;
                return;
            }

            this.displayConfirmModal = true;
        },
        initiateUnstake() {
            if (!this.canDeposit){
                this.notifyMaxDeposits();
                return;
            }
            this.ctaIsLoading = true;
            const value = BigNumber.from(this.bottomInputAmount);

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

<style lang="sass"></style>
