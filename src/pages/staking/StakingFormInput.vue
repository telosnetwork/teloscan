<script>
import { BigNumber, ethers } from 'ethers';

import { WEI_PRECISION } from 'src/lib/utils';

const { commify, parseUnits, formatEther } = ethers.utils;

const dot = '.';
const zeroDot = '0.';
const zero = '0';
const notIntegerOrDotRegex = /[^\d.]/g;
const notIntegerDotOrCommaRegex = /[^\d,.]/g;
const leadingZeroesRegex = /^0+(?!$|\.)/g;
const decimalRegex = /\.\d+$/g;
const dotZeroRegex = /\.0$/g;
const commaRegex = /,/g;
const dotRegex = /\./g;

export default {
    name: 'StakingFormInput',
    props: {
        modelValue: {
            type: String,
            required: true,
            validator: str => typeof str === 'string' && /^\d{1,256}$/.test(str),
        },
        label: {
            type: String,
            required: true,
        },
        infoText: {
            type: String,
            default: '',
        },
        errorText: {
            type: String,
            default: '',
        },
        tooltip: {
            type: String,
            default: '',
        },
        isLoading: {
            type: Boolean,
            required: true,
        },
        maxValue: {
            type: String,
            default: null,
            validator: str => BigNumber.from(str),
        },
    },
    emits: ['update:modelValue'],
    watch: {
        modelValue(newVal) {
            const newValWeiBn = BigNumber.from(newVal || zero);
            const currentValWeiBn = parseUnits(
                this.$refs.input.value?.replaceAll(',', '') || zero,
            );
            const newValIsDifferent = !newValWeiBn.eq(currentValWeiBn);

            if (newValIsDifferent) {
                const formattedNewVal = formatEther(newValWeiBn).replace(dotZeroRegex, '');
                this.setInputValue(formattedNewVal);
                this.handleInput();
            }
        },
        maxValue() {
            this.handleInput();
        },
    },
    methods: {
        handleInfoClick() {
            this.$emit('update:modelValue', this.maxValue);
        },
        handleKeydown(event) {
            const { input } = this.$refs;

            const numKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const modifierKeys = ['ctrl', 'meta', 'shift', 'alt'].map(mod => `${mod}Key`);
            const value = input.value;
            const caretPosition = input.selectionStart;
            const pressedKey = event.key;

            const eventHasModifiers = modifierKeys.some(modifier => event[modifier] === true);
            const targetHasNoSelection = caretPosition === input.selectionEnd;
            const deletingBackward = event.key === 'Backspace' && !eventHasModifiers && targetHasNoSelection;
            const deletingForward  = event.key === 'Delete'    && !eventHasModifiers && targetHasNoSelection;

            const nextCharacterIsComma     = commaRegex.test(value[caretPosition]);
            const previousCharacterIsComma = commaRegex.test(value[caretPosition - 1]);
            const nextCharacterIsDot       =   dotRegex.test(value[caretPosition]);
            const previousCharacterIsDot   =   dotRegex.test(value[caretPosition - 1]);

            const deletingDot = (deletingForward && nextCharacterIsDot) || (deletingBackward && previousCharacterIsDot);
            const deletingComma = (deletingForward && nextCharacterIsComma) ||
                (deletingBackward && previousCharacterIsComma);

            if (deletingDot) {
                this.setInputValue(value.replace(dotRegex, ''));
            } else if (deletingForward && nextCharacterIsComma) {
                const preCommaInclusive = value.slice(0, caretPosition + 1);
                const newPostComma =      value.slice(caretPosition + 2);

                this.setInputValue(preCommaInclusive.concat(newPostComma));
            } else if (deletingBackward && previousCharacterIsComma) {
                const newPreComma =        value.slice(0, caretPosition - 2);
                const postCommaInclusive = value.slice(caretPosition - 1);

                this.setInputValue(newPreComma.concat(postCommaInclusive));
            }

            if (deletingDot || deletingComma) {
                this.setInputCaretPosition(caretPosition);
                event.preventDefault();
                this.handleInput();
                return;
            }

            const tryingToAddDigitsPastMaxPrecision = (() => {
                const [integer = '', fractional = ''] = value.split(dot);

                const keypressIsDigit = numKeys.includes(event.key);
                const caretIsPastDecimal = caretPosition > integer.length + 1;
                const fractionalUnderMaxLength = fractional.length < WEI_PRECISION;

                return keypressIsDigit && caretIsPastDecimal && !fractionalUnderMaxLength;
            })();
            const tryingToAddSecondDot = pressedKey === dot && value.includes(dot);
            const tryingToAddLeadingZeroes =
                pressedKey === zero &&
                value[0] !== dot &&
                value.length > 1 &&
                caretPosition === 0;

            const invalidKeystroke =
                tryingToAddDigitsPastMaxPrecision ||
                tryingToAddSecondDot ||
                tryingToAddLeadingZeroes;

            if (invalidKeystroke) {
                event.preventDefault();
            }
        },
        handleInput() {
            const emit = (val) => {
                if (val !== this.modelValue) {
                    this.$emit('update:modelValue', val);
                }
            };

            const { input } = this.$refs;

            this.setInputValue(
                String(input.value)
                    .replace(leadingZeroesRegex, '')
                    .replace(notIntegerDotOrCommaRegex, ''),
            );

            if (['', null, undefined, zero, zeroDot, dot].includes(input.value)) {
                if (input.value === dot) {
                    this.setInputValue(zeroDot);
                }

                emit(zero);
                return;
            }

            let caretPosition = input.selectionStart;
            const savedCommaCount = (input.value.match(commaRegex) || []).length;

            // remove extraneous dots not handled in keydownHandler (ie. from pasted values)
            if ((input.value?.match(dotRegex) ?? []).length > 1) {
                const { value } = input;
                const afterFirstDotIndex = value.indexOf(dot) + 1;
                const int = value.slice(0, afterFirstDotIndex);
                const fractional = value.slice(afterFirstDotIndex).replaceAll(dot, '');
                this.setInputValue(int.concat(fractional));
            }

            // don't format or emit if the user is about to type a decimal
            if (input.value[input.value.length - 1] === dot && caretPosition === input.value.length) {
                return;
            }

            let workingValue = input.value.replace(notIntegerOrDotRegex, '') ?? '';
            let workingValueAsWeiBn = parseUnits(workingValue, 'ether');

            if (!!this.maxValue && workingValueAsWeiBn.gt(this.maxValue)) {
                workingValue = formatEther(this.maxValue);
                workingValueAsWeiBn = parseUnits(workingValue, 'ether');
                caretPosition = workingValue.length;
                this.triggerWiggle();
            }

            let commifiedWorkingValue = commify(workingValue);

            if (commifiedWorkingValue.includes(dot)) {
                // override commify's handling of trailing zeroes to allow user to continue typing past 1 zero
                //    eg. 123.00003
                const commifiedInteger = commifiedWorkingValue.replace(decimalRegex, '');
                const fractional = (workingValue.match(decimalRegex)?.[0] ?? '').slice(0, WEI_PRECISION);

                commifiedWorkingValue = `${commifiedInteger}${fractional}`;
            }

            this.setInputValue(commifiedWorkingValue);

            const newCommaCount = (input.value.match(commaRegex) ?? []).length;
            const deltaCommaCount = newCommaCount - savedCommaCount;

            this.setInputCaretPosition(caretPosition + deltaCommaCount);
            emit(workingValueAsWeiBn.toString());
        },
        setInputValue(val) {
            this.$refs.input.value = val;
        },
        setInputCaretPosition(val) {
            ['Start', 'End'].forEach((property) => {
                this.$refs.input[`selection${property}`] = val;
            });
        },
        triggerWiggle() {
            this.$el.classList.add('c-staking-input--wiggle');
        },
        handleWiggleEnd() {
            this.$el.classList.remove('c-staking-input--wiggle');
        },
    },
};
</script>

<template>
<div
    class="c-staking-input container-fluid shadow-3"
    @animationend="handleWiggleEnd"
>
    <div class="row">
        <div class="col-6">
            <h6 class="c-staking-input__label">
                {{ label }}
            </h6>
        </div>
        <div class="col-6 u-flex--right">
            <p v-if="errorText" class="text-negative">
                {{ errorText }}
            </p>

            <div
                v-else-if="infoText"
                class="c-staking-input__info-container"
                @click="handleInfoClick"
            >
                <q-tooltip
                    :offset="[0, 88]"
                    anchor="top middle"
                    self="top middle"
                >
                    <span class="c-staking-input__tooltip-text">{{ tooltip }}</span>
                </q-tooltip>

                {{ infoText }}
                <q-icon name="fas fa-info-circle q-pl-xs info-icon" />
            </div>
        </div>
    </div>
    <div class="row">
        <div class="col">
            <input
                v-show="!isLoading"
                ref="input"
                :disabled="isLoading"
                type="text"
                pattern="[0-9.]*"
                inputmode="decimal"
                placeholder="0"
                class="c-staking-input__input"
                @keydown="handleKeydown"
                @input.stop="handleInput"
            >
            <div v-if="isLoading" class="c-staking-input__loading u-flex--left">
                <i class="fa fa-spinner fa-spin"></i>
            </div>
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-staking-input {
    height: 104px;
    padding: 16px;
    border-radius: 6px;
    background-color: rgba($secondary, 0.03);

    animation-duration: 350ms;
    animation-iteration-count: 1;
    animation-timing-function: linear;

    &--wiggle {
        animation-name: wiggle;
    }

    &__label {
        margin: 0;
    }

    &__info-container {
        display: flex;
        align-items: center;
        cursor: pointer;
        width: min-content;
        white-space: nowrap;
    }

    &__tooltip-text {
        white-space: pre;
    }

    &__input,
    &__loading {
        height: 36px;
    }

    &__input {
        width: 100%;
        margin: auto;

        color: $white;
        background: none;
        border: none;
        outline: none;
        font-size: 1.4rem;

        @at-root .body--light & {
            color: $info;
        }
    }

    @keyframes wiggle {
        0% {
            transform: translateX(0);
        }

        25% {
            transform: translateX(-4px);
        }

        50% {
            transform: translateX(4px);
        }

        75% {
            transform: translateX(-4px);
        }

        100% {
            transform: translateX(0);
        }
    }
}
</style>
