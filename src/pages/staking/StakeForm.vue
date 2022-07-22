<template>
<!-- eztodo need to add @input handler here, question vmodel -->

<base-staking-form
    :header="header"
    :subheader="subheader"
    :top-input-label="topInputLabel"
    :top-input-info-text="topInputInfoText"
    :top-input-amount="topInputAmount"
    :top-input-has-error="topInputHasError"
    :bottom-input-label="bottomInputLabel"
    :bottom-input-amount="bottomInputAmount"
    :bottom-input-has-error="bottomInputHasError"
    :cta-text="ctaText"
    :cta-disabled="ctaIsDisabled"
/>
</template>

<script>
import { mapGetters } from 'vuex';

import BaseStakingForm from 'pages/staking/BaseStakingForm';


export default {
    name: 'StakeForm',
    components: {
        BaseStakingForm,
    },
    data: () => ({
        header: 'Stake TLOS',
        subheader: 'Staked sTLOS provide you with access to a steady income and access to our Defi applications',
        topInputLabel: 'Stake TLOS',
        // topInputInfoText: '',
        topInputAmount: '0',
        // topInputHasError: false,
        bottomInputLabel: 'Receive sTLOS',
        // bottomInputAmount: '',
        bottomInputHasError: false,
    }),
    computed: {
        ...mapGetters('login', ['isLoggedIn']),
        topInputInfoText() {
            if (!this.isLoggedIn)
                return 'Wallet not connected';

            // get this from wallet
            const availableTLOS = Number.prototype.toLocaleString.call(1234567);

            return `${availableTLOS} Available`;
        },
        topInputHasError() {
            return !this.isLoggedIn;
        },
        ctaIsDisabled() {
            return this.topInputHasError || this.topInputAmount === '0';
        },
        ctaText() {
            // should not actually be this. disable when input is invalid, logged out = enabled, launches metamask
            return this.ctaIsDisabled ? 'Connect Wallet' : 'Stake';
        },
        bottomInputAmount() {
            // convert topInputAmount to sTLOS

            return this.topInputAmount;
        },
    },
}
</script>

<style lang="scss">
</style>
