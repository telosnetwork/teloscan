<template>
<div class="c-base-staking-form container-fluid">
    <div class="row">
        <div class="col-sm-12 col-md-6 offset-md-3">
            <div class="row q-mb-md">
                <div class="col">
                    <h5 class="c-base-staking-form__header">
                        {{ header }}
                    </h5>
                    <p>{{ subheader }}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <staking-form-input
                        :value="topInputAmount"
                        v-bind="inputs[0]"
                        @input="handleInput($event, 0)"
                    />
                </div>

                <div class="col-12 u-flex--center">
                    <div class="c-base-staking-form__decorative-chevron" />
                </div>

                <div class="col-12 q-mb-md">
                    <staking-form-input
                        :value="bottomInputAmount"
                        v-bind="inputs[1]"
                        @input="handleInput($event, 1)"
                    />
                </div>

                <div class="col-12 u-flex--space-between">
                    <p class="c-base-staking-form__footer-p">
                        Please note that there is an unstaking period of {{ unstakePeriod }}
                    </p>

                    <q-btn
                        :disabled="ctaDisabled"
                        color="secondary"
                        text-color="black"
                        @click="handleCtaClick"
                    >
                        {{ ctaText }}
                    </q-btn>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import StakingFormInput from 'pages/staking/StakingFormInput';

const genericMaxWei = '999999999999000000000000000000';
const DAY_SECONDS = 86400;
const HOUR_SECONDS = 3600;

export default {
    name: 'BaseStakingForm',
    components: {
        StakingFormInput,
    },
    props: {
        header: {
            type: String,
            required: true,
        },
        subheader: {
            type: String,
            required: true,
        },
        topInputLabel: {
            type: String,
            required: true,
        },
        topInputInfoText: {
            type: String,
            required: true,
        },
        topInputAmount: {
            type: String,
            required: true,
        },
        topInputMaxValue: {
            type: String,
            default: null,
        },
        topInputErrorText: {
            type: String,
            required: true,
        },
        topInputIsLoading: {
            type: Boolean,
            required: true,
        },
        bottomInputLabel: {
            type: String,
            required: true,
        },
        bottomInputAmount: {
            type: String,
            required: true,
        },
        bottomInputMaxValue: {
            type: String,
            default: null,
        },
        bottomInputIsLoading: {
            type: Boolean,
            required: true,
        },
        ctaText: {
            type: String,
            required: true,
        },
        ctaDisabled: {
            type: Boolean,
            required: true,
        },
    },
    data: () => ({
        unstakePeriod: '', 
        stlosContract: null,
    }),
    computed: {
        inputs() {
            return [{
                label:    this.topInputLabel,
                infoText: this.topInputInfoText,
                errorText: this.topInputErrorText,
                maxValueWei: this.topInputMaxValue ?? genericMaxWei,
                isLoading: this.topInputIsLoading,
            }, {
                label:    this.bottomInputLabel,
                errorText: '',
                maxValueWei: this.bottomInputMaxValue,
                isLoading: this.bottomInputIsLoading,
            }];
        },
    },
    async created(){
        const escrowContract = await (await this.$contractManager.getContract(process.env.STLOS_ESCROW_CONTRACT_ADDRESS)).getContractInstance();
        this.unstakePeriod = this.formatTime((await escrowContract.lockDuration()).toNumber());
    },
    methods: {
        formatTime(seconds){
            return  seconds < DAY_SECONDS ? seconds < HOUR_SECONDS ? `${seconds / 60} minutes`: `${seconds / HOUR_SECONDS} hours` : `${seconds / DAY_SECONDS} days`
        },
        handleInput(event, index) {
            const eventName = 'input-'.concat(index === 0 ? 'top' : 'bottom');

            this.$emit(eventName, event);
        },
        handleCtaClick() {
            this.$emit('cta-clicked');
        },
    },
}
</script>

<style lang="scss">
.c-base-staking-form {
    &__header {
        margin: 0 0 8px;
    }

    &__decorative-chevron {
        height: 56px;
        position: relative;

        &::before,
        &::after {
            content: '';
            position: absolute;
            top: 0;
            bottom: 0;
            margin: auto;

            height: 48px;
            width: 4px;
            border-radius: 4px 4px 0 0;

            background-color: $grey-0;

            @at-root .body--light & {
                background-color: $purpleDark;
            }
        }

        &::before {
            left: -21px;
            transform: rotate(-55deg);
        }

        &::after {
            right: -20px;
            transform: rotate(55deg);
        }
    }

    &__footer-p {
        font-size: 12px;
        margin: 0;

        color: $grey-0;

        @at-root .body--light & {
            color: $purpleDark
        }
    }
}
</style>
