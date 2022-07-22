<template>
<div class="c-base-staking-form container-fluid">
    <div class="row">
        <div class="col-sm-12 col-md-6 offset-md-3">
            <div class="row q-mb-md">
                <div class="col">
                    <h5 class="c-base-staking-form__header">
                        {{ header }}
                    </h5>
                    <!-- eztodo make <p> dark mode compatible -->
                    <p>{{ subheader }}</p>
                </div>
            </div>
            <div class="row">
                <div class="col-12">
                    <staking-form-input
                        :value="topInputAmount"
                        v-bind="inputs[0]"
                        @input="handleInput($event)"
                    />
                </div>

                <div class="col-12 u-flex--center">
                    <div class="c-base-staking-form__decorative-chevron" />
                </div>

                <div class="col-12 q-mb-md">
                    <staking-form-input
                        :value="bottomInputAmount"
                        v-bind="inputs[1]"
                    />
                </div>

                <div class="col-12 u-flex--space-between">
                    <p class="c-base-staking-form__footer-p">
                        Please note that there is an unstaking period of {{ unstakePeriodDays }} days
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
        topInputHasError: {
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
        bottomInputHasError: {
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
        unstakePeriodDays: 5,
    }),
    computed: {
        inputs() {
            return [{
                label:    this.topInputLabel,
                infoText: this.topInputInfoText,
                hasError: this.topInputHasError,
            }, {
                label:    this.bottomInputLabel,
                infoText: this.bottomInputInfoText,
                hasError: this.bottomInputHasError,
            }];
        },
        transactionIsValid() {
            return !this.topInputHasError && !this.bottomInputHasError;
        },
    },
    methods: {
        handleInput(event) {
            this.$emit('input', event);
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
            // background-color: $white;
            border-radius: 4px 4px 0 0;


            @at-root .body--dark & {
                background-color: $white;
            }

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

    // &__footer {
    //     display: flex;
    //     align-items: center;
    //     justify-content: space-between;
    // }

    &__footer-p {
        // gray text
        // small
        // white-space: nowrap;
        font-size: 12px;
        color: $grey-0;
        margin: 0;
    }
}
</style>
