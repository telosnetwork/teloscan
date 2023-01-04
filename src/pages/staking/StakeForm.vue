<template>
<div class="c-stake-form row">
    <div class="col-xs-12 col-md-6 offset-md-3">
        <q-banner
            v-if="showClaimBanner"
            rounded
            inline-actions
            dense
            class="bg-green text-black"
        >
            You have unlocked TLOS!
            <template #action>
                <q-btn
                    flat
                    color="black"
                    label="Dismiss"
                    @click="hideClaimBanner"
                />
                <q-btn
                    flat
                    color="black"
                    label="Claim TLOS"
                    @click="$router.push({ hash: '#claim' })"
                />
            </template>
        </q-banner>
    </div>
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
        Stake successful! View Transaction:
        <transaction-field :transaction-hash="resultHash" />
    </div>
    <q-dialog v-model="displayConfirmModal">
        <q-card>
            <q-card-section>
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
                <p
                    v-if="showMetamaskPrompt"
                    class="c-stake-form__metamask-prompt u-flex--center-y"
                    tabindex="0"
                    aria-label="Launch MetaMask dialog to add sTLOS"
                    @click="promptAddToMetamask"
                >
                    Add sTLOS to MetaMask
                    <img
                        :src="MetaMaskLogo"
                        class="q-ml-xs"
                        height="24"
                        width="24"
                        alt="MetaMask Fox Logo"
                    >
                </p>
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
import MetaMaskLogo from 'src/assets/metamask-fox.svg'
import { stlos } from 'src/lib/logos';


import { formatUnstakePeriod } from 'pages/staking/staking-utils';
import { promptAddToMetamask } from 'src/lib/token-utils';
import { WEI_PRECISION } from 'src/lib/utils';

import BaseStakingForm from 'pages/staking/BaseStakingForm';
import TransactionField from 'components/TransactionField';
import { triggerLogin } from 'components/ConnectButton';

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
        hasUnlockedTlos: {
            type: Boolean,
            required: true,
        },
        unstakePeriodSeconds: {
            type: Number,
            default: null,
        },
        valueOfOneStlosInTlos: {
            type: String,
            default: null,
        },
    },
    emits: ['balance-changed'],
    data: () => ({
        MetaMaskLogo,
        displayConfirmModal: false,
        resultHash: null,
        header: 'Stake TLOS',
        subheader: 'Staking your TLOS to sTLOS grants you access to a steady income and various DeFi applications, ' +
            'further increasing yield. As the reward pool increases, the TLOS to sTLOS conversion rate will change ' +
            'over time. Therefore, the amount of sTLOS received is smaller than the staked TLOS. Rewards will be ' +
            'auto-compounded. No further action is required.',
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
        userDismissedBanner: false,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn', 'isNative']),
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
                if (walletBalanceBn.lt(reservedForGasBn) && !this.isNative)
                    return 'Insufficient TLOS balance to stake';
                else if(this.isNative)
                    return 'Login using an EVM wallet'
                else
                    return '';
            }

            return 'Wallet not connected';
        },
        topInputTooltip() {
            const prettyBalance = ethers.utils.formatEther(this.usableWalletBalance).toString();
            return 'Click to input full wallet balance\n\n' +
                   'Balance displayed is reduced by 1 TLOS to keep your account actionable.\n' +
                   'Precise balance (less approximate gas fees):\n' +
                   `${prettyBalance} TLOS`;
        },
        ctaIsDisabled() {
            const inputsInvalid = (
                this.isLoggedIn &&
                this.walletBalanceBn.gt(reservedForGasBn) &&
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

            if (this.isLoggedIn) {
                if (this.walletBalanceBn.lt(reservedForGasBn))
                    return 'Get more TLOS';
                else
                    return 'Stake TLOS';
            }

            return 'Connect Wallet';
        },
        showClaimBanner() {
            return this.hasUnlockedTlos && !this.userDismissedBanner;
        },
        showMetamaskPrompt() {
            return window?.ethereum?.isMetaMask === true;
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
        promptAddToMetamask() {
            return promptAddToMetamask(
                this.$q,
                process.env.STAKED_TLOS_CONTRACT_ADDRESS,
                'STLOS',
                stlos,
                'ERC20',
                WEI_PRECISION,
            );
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
                triggerLogin();
                return;
            }

            const walletBalanceBn = BigNumber.from(this.tlosBalance ?? '0');

            if (walletBalanceBn.lt(reservedForGasBn)) {
                window.open('https://telos.net', '_blank');
                return;
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
        hideClaimBanner() {
            this.userDismissedBanner = true;
        },
    },
}
</script>

<style lang="scss">
.c-stake-form {
    &__metamask-prompt {
        color: $secondary;
        cursor: pointer;
        width: max-content;
        margin-right: auto;
        margin-bottom: 0;
    }
}
</style>
