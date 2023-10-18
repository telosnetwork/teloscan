<!-- eslint-disable max-len -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable no-unused-vars -->
<script lang="ts">
import { defineComponent } from 'vue';
import { mapGetters } from 'vuex';
import { BigNumber, ethers } from 'ethers';
import { debounce, DebouncedFunc } from 'lodash';
import { stlos } from 'src/lib/logos';


import { formatUnstakePeriod } from 'pages/staking/staking-utils';
import { promptAddToMetamask } from 'src/lib/token-utils';
import {
    getClientIsApple,
    LOGIN_DATA_KEY,
    PROVIDER_WEB3_INJECTED,
    WEI_PRECISION,
} from 'src/lib/utils';

import BaseStakingForm from 'pages/staking/BaseStakingForm.vue';
import TransactionField from 'components/TransactionField.vue';
import LoginModal from 'components/LoginModal.vue';
import { useAccountStore, CURRENT_CONTEXT } from 'src/antelope/mocks';
import { EvmABI, stlosAbiDeposit } from 'src/antelope/wallets/types';

const reservedForGasBn = BigNumber.from('10').pow(WEI_PRECISION);

export default defineComponent({
    name: 'StakeForm',
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
        displayConfirmModal: false,
        displayLoginModal: false,
        resultHash: null as null | string,
        header: '',
        subheader: '',
        topInputLabel: '',
        topInputAmount: '0',
        topInputIsLoading: false,
        bottomInputMaxValue: '',
        bottomInputIsLoading: false,
        bottomInputLabel: '',
        bottomInputAmount: '0',
        ctaIsLoading: false,
        debouncedTopInputHandler: (() => void 0) as DebouncedFunc<() => void>,
        debouncedBottomInputHandler: (() => void 0) as DebouncedFunc<() => void>,
        userDismissedBanner: false,
    }),
    computed: {
        ...mapGetters('login', ['address', 'isLoggedIn', 'isNative']),
        unstakePeriodPretty() {
            return formatUnstakePeriod(this.unstakePeriodSeconds, this.$t);
        },
        topInputMaxValue() {
            return this.isLoggedIn ? this.usableWalletBalance : '';
        },
        walletBalanceBn() {
            return BigNumber.from(this.tlosBalance ?? '0');
        },
        usableWalletBalance() {
            if (this.walletBalanceBn.lte(reservedForGasBn)) {
                return '0';
            }

            return this.walletBalanceBn.sub(reservedForGasBn).toString();
        },
        topInputInfoText() {
            if (!this.isLoggedIn) {
                return '';
            }

            let balanceEth = ethers.utils.formatEther(this.usableWalletBalance);

            if (balanceEth.indexOf('.') >= 0) {
                const [integer, fraction] = balanceEth.split('.');

                balanceEth = integer.concat(`.${fraction.slice(0, 3)}`);
            }

            const balanceTlos = ethers.utils.commify(balanceEth);

            return this.$t('pages.staking.available', { balanceTlos });
        },
        topInputErrorText() {
            const walletBalanceBn = BigNumber.from(this.tlosBalance ?? '0');

            if (this.isLoggedIn) {
                if (walletBalanceBn.lt(reservedForGasBn) && !this.isNative) {
                    return this.$t('pages.staking.insufficient_tlos_balance');
                } else if(this.isNative) {
                    return this.$t('pages.staking.login_using_an_evm_wallet');
                } else {
                    return '';
                }
            }

            return this.$t('pages.staking.wallet_not_connected');
        },
        topInputTooltip() {
            const prettyBalance = ethers.utils.formatEther(this.usableWalletBalance).toString();
            return this.$t('pages.staking.click_to_input_full_wallet_balance', { prettyBalance });
        },
        ctaIsDisabled() {
            const inputsInvalid = (
                this.isLoggedIn &&
                this.walletBalanceBn.gt(reservedForGasBn) &&
                [this.topInputAmount, this.bottomInputAmount].some(amount => BigNumber.from(amount ?? '0').eq('0'))
            );

            return inputsInvalid ||
                this.topInputIsLoading ||
                this.bottomInputIsLoading ||
                this.ctaIsLoading;
        },
        ctaText() {
            if (this.ctaIsLoading) {
                return this.$t('pages.staking.loading');
            }

            if (this.isLoggedIn) {
                if (this.walletBalanceBn.lt(reservedForGasBn)) {
                    return this.$t('pages.staking.get_more_tlos');
                } else {
                    return this.$t('pages.staking.stake_tlos');
                }
            }

            return this.$t('pages.staking.connect_wallet');
        },
        showClaimBanner() {
            return this.hasUnlockedTlos && !this.userDismissedBanner;
        },
        showMetamaskPrompt() {
            return window?.ethereum?.isMetaMask === true;
        },
        abi(): EvmABI {
            return stlosAbiDeposit;
        },
    },
    async created() {
        // Initialization of the text translations
        this.header = this.$t('pages.staking.stake_tlos');
        this.subheader = this.$t('pages.staking.stake_tlos_subheader');
        this.topInputLabel = this.$t('pages.staking.stake_tlos');
        this.bottomInputLabel = this.$t('pages.staking.receive_stlos');

        const debounceWaitMs = 250;

        this.debouncedTopInputHandler = debounce(
            () => {
                this.stlosContractInstance.previewDeposit(this.topInputAmount)
                    .then((amountBigNum: ethers.BigNumber) => {
                        this.bottomInputAmount = amountBigNum.toString();
                    })
                    .catch((err: any) => {
                        this.bottomInputAmount = '';
                        console.error(`Unable to convert TLOS to STLOS: ${err}`);
                        this.$q.notify({
                            type: 'negative',
                            message: this.$t('pages.staking.redeem_failed', { message: err }),
                        });
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
                    });
            },
            debounceWaitMs,
        );

        this.debouncedBottomInputHandler = debounce(
            () => {
                this.stlosContractInstance.previewRedeem(this.bottomInputAmount)
                    .then((amountBigNum: { toString: () => string; }) => {
                        this.topInputAmount = amountBigNum.toString();
                    })
                    .catch((err: any) => {
                        this.topInputAmount = '';
                        console.error(`Unable to convert STLOS to TLOS: ${err}`);
                        this.$q.notify({
                            type: 'negative',
                            message: this.$t('pages.staking.redeem_failed', { message: err }),
                        });
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
                    });
            },
            debounceWaitMs,
        );
    },
    methods: {
        promptAddToMetamask() {
            return promptAddToMetamask(
                this.$q,
                process.env.STAKED_TLOS_CONTRACT_ADDRESS as string,
                'STLOS',
                stlos,
                'ERC20',
                WEI_PRECISION,
            );
        },
        handleInputTop(newWei = '0') {
            if (newWei === this.topInputAmount) {
                return;
            }

            this.bottomInputIsLoading = true;
            this.topInputAmount = newWei;

            this.debouncedTopInputHandler();
        },
        handleInputBottom(newWei = '0') {
            if (newWei === this.bottomInputAmount) {
                return;
            }

            this.topInputIsLoading = true;
            this.bottomInputAmount = newWei;

            this.debouncedBottomInputHandler();
        },
        handleCtaClick() {
            if (!this.isLoggedIn) {
                this.displayLoginModal = true;
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

            let waitTheTransaction: Promise<{hash: string | null}> = Promise.resolve({ hash: null });
            try {
                const loginData = localStorage.getItem(LOGIN_DATA_KEY);
                console.log('initiateDeposit() loginData: ', loginData);
                if (loginData) {
                    const loginObj = JSON.parse(loginData);
                    switch(loginObj?.provider) {
                    case PROVIDER_WEB3_INJECTED:
                        // TODO: remove legacy code
                        // https://github.com/telosnetwork/teloscan/issues/462
                        waitTheTransaction = this.continueDepositLegacy(value);
                        break;
                    default:
                        waitTheTransaction = this.continueDeposit(value);
                    }
                }

                waitTheTransaction.then((result) => {
                    this.resultHash = result.hash;
                    this.$emit('balance-changed');
                }).catch(({ message }: Error) => {
                    console.error(`Failed to deposit TLOS: ${message}`);
                    this.$q.notify({
                        type: 'negative',
                        message: this.$t('pages.staking.deposit_failed', { message }),
                    });
                    this.resultHash = null;
                }).finally(() => {
                    this.ctaIsLoading = false;
                });


            } catch (e) {
                console.error('Failed to deposit TLOS', e);
            } finally {
                this.ctaIsLoading = false;
            }
        },
        continueDeposit(value: BigNumber) {
            const authenticator = useAccountStore().getAccount(CURRENT_CONTEXT).authenticator;

            return authenticator.signCustomTransaction(
                this.stlosContractInstance.address,
                this.abi,
                [],
                value,
            );
        },
        continueDepositLegacy(value: BigNumber) {
            return this.stlosContractInstance['depositTLOS()']({ value }) as Promise<{ hash: null | string; }>;
        },
        hideClaimBanner() {
            this.userDismissedBanner = true;
        },
    },
});
</script>

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
            {{ $t('pages.staking.you_have_unlocked_tlos') }}
            <template #action>
                <q-btn
                    flat
                    color="black"
                    :label="$t('global.dismiss')"
                    @click="hideClaimBanner"
                />
                <q-btn
                    flat
                    color="black"
                    :label="$t('pages.staking.claim_tlos')"
                    @click="$router.push({ hash: '#withdraw' })"
                />
            </template>
        </q-banner>
    </div>
    <div class="col-12 q-mb-lg">
        <BaseStakingForm
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
        {{ $t('pages.staking.stake_tlos_success') }}
        <TransactionField :transaction-hash="resultHash" />
    </div>
    <q-dialog v-model="displayConfirmModal">
        <q-card>
            <q-card-section>
                <p>
                    {{ $t('pages.staking.stake_tlos_confirm') }}
                </p>
                <p>
                    {{ $t('pages.staking.stake_tlos_confirm_2a' ) }}
                    {{ unstakePeriodPretty }},
                    {{ $t('pages.staking.stake_tlos_confirm_2b' ) }}
                </p>
                <p>{{ $t('pages.staking.stake_tlos_confirm_3' ) }}</p>
            </q-card-section>

            <q-card-actions align="right" class="q-pb-md q-px-md">
                <p
                    v-if="showMetamaskPrompt"
                    class="c-stake-form__metamask-prompt u-flex--center-y"
                    tabindex="0"
                    :aria-label="$t('pages.staking.add_stlos_to_metamask')"
                    @click="promptAddToMetamask"
                >
                    {{ $t('pages.staking.add_stlos_to_metamask') }}
                    <img
                        :src="require('src/assets/metamask-fox.svg')"
                        class="q-ml-xs"
                        height="24"
                        width="24"
                        :alt="$t('pages.staking.metamask_fox_logo')"
                    >
                </p>
                <q-btn
                    v-close-popup
                    flat
                    :label="$t('pages.staking.cancel')"
                    color="negative"
                />
                <q-btn
                    v-close-popup
                    :label="$t('pages.staking.stake_tlos')"
                    color="secondary"
                    text-color="black"
                    @click="initiateDeposit"
                />
            </q-card-actions>
        </q-card>
    </q-dialog>
</div>
<LoginModal :show="displayLoginModal" @hide="displayLoginModal = false" />
</template>

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
