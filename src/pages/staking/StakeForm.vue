<template>
<base-staking-form
    :header="header"
    :subheader="subheader"
    :top-input-label="topInputLabel"
    :top-input-info-text="topInputInfoText"
    :top-input-amount="topInputAmount"
    :top-input-max-value="topInputMaxValue"
    :top-input-has-error="topInputHasError"
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

const tokens = {
    tlos: 'tlos',
    stlos: 'stlos',
};

export default {
    name: 'StakeForm',
    components: {
        BaseStakingForm,
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
        wallet: { balance: '123456789987654321' },  // eztodo get from wallet / service
    }),
    computed: {
        ...mapGetters('login', ['isLoggedIn']),
        topInputMaxValue() {
            return this.isLoggedIn ? this.wallet.balance : null;
        },
        topInputInfoText() {
            if (!this.isLoggedIn)
                return 'Wallet not connected';

            // get this from wallet
            const availableTLOS = ethers.utils.commify(BigNumber.from(this.wallet.balance ?? '0').toString());

            return `${availableTLOS} Available`;
        },
        topInputHasError() {
            return !this.isLoggedIn;
        },
        ctaIsDisabled() {

            return this.topInputIsLoading ||
                this.bottomInputIsLoading ||
                (
                    this.isLoggedIn &&
                    [this.topInputAmount, this.bottomInputAmount].some(amount => ['0', ''].includes(amount))
                );
        },
        ctaText() {
            return this.isLoggedIn ? 'Stake' : 'Connect Wallet';
        },
    },
    methods: {
        handleInputTop(newWei = '0') {
            if (newWei === this.topInputAmount)
                return;

            this.bottomInputIsLoading = true;
            this.topInputAmount = newWei;

            const debouncedCall = debounce(
                () => this.previewExchange(this.topInputAmount, tokens.tlos)
                    .then(amount => this.bottomInputAmount = amount)
                    .catch(err => {
                        this.bottomInputAmount = '';
                        console.error(err);
                    })
                    .finally(() => this.bottomInputIsLoading = false),
                750,
            );

            debouncedCall();
        },
        handleInputBottom(newWei = '0') {
            this.previewExchange(newWei, tokens.stlos);
        },
        handleCtaClick() {
            if (!this.isLoggedIn) triggerLogin();
        },
        previewExchange(wei) {
            // let endpoint = '';

            // if (token === tokens.tlos) {
            //     endpoint = 'placeholder - endpoint to get sTLOS for given TLOS amount';
            // } else if (token === tokens.tlos) {
            //     endpoint = 'placeholder - endpoint to get TLOS for given sTLOS amount';
            // }

            // return this.$teloscanApi.get(endpoint, wei);

            return Promise.resolve(wei);
        },
    },
}
</script>

<style lang="scss">
</style>
