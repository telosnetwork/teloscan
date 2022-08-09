<template>
<div class="c-staking-input container-fluid shadow-3">
    <div class="row">
        <div class="col-6">
            <h6 class="c-staking-input__label">
                {{ label }}
            </h6>
        </div>
        <div class="col-6 u-flex--right">
            <p
                v-if="errorText"
                class="text-red"
            >
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
                    <!-- eztodo improve this message - should convey that this total balance isn't exactly equal to wallet balance -->
                    Click to input full wallet balance<br><br>
                    Exact balance (less approx. gas fees):<br>
                    {{ availableBalance }} TLOS
                </q-tooltip>

                {{ infoText }}
                <q-icon name="fas fa-info-circle q-pl-xs" />
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
                pattern="[0-9]*"
                inputmode="numeric"
                placeholder="0"
                class="c-staking-input__input"
                @keydown="handleKeydown"
                @input="handleInput"
            >
            <div
                v-if="isLoading"
                class="c-staking-input__loading u-flex--left"
            >
                <i class="fa fa-spinner fa-spin" />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { BigNumber, ethers } from 'ethers';

import { WEI_PRECISION } from 'src/lib/utils';

const { commify, parseUnits, formatEther} = ethers.utils;

const dot = '.';
const illegalCharsEthRegex = /[^0-9.]/g;
const illegalCharsPrettyEthRegex = /[^0-9,.]/g;
const leadingZeroesRegex = /^0+/g;
const trailingZeroesRegex = /0+$/g
const trailingDotZeroRegex = /\.0+$/g;
const commaRegex = /,/g;
const dotRegex = /\./g;

export default {
    name: 'StakingFormInput',
    props: {
        value: {
            type: String,
            required: true,
            validator: str => BigNumber.from(str),
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
        isLoading: {
            type: Boolean,
            required: true,
        },
        maxValueWei: {
            type: String,
            default: null,
            validator: str => BigNumber.from(str),
        },
    },
    computed: {
        availableBalance() {
            const balance = formatEther(this.maxValueWei).toString();
            return `${balance}`;
        },
    },
    watch: {
        value(newVal) {
            const newValWeiBn = BigNumber.from(newVal || '0');
            const currentValWeiBn = parseUnits(
                this.$refs.input.value?.replaceAll(',', '') || '0',
            );
            const newValIsDifferent = !newValWeiBn.eq(currentValWeiBn);

            if (newValIsDifferent) {
                const formattedNewVal = formatEther(newValWeiBn).replace(/.0$/g, '');
                this.setInputValue(formattedNewVal);
                this.handleInput();
            }
        },
    },
    methods: {
        handleInfoClick() {
            this.$emit('input', this.maxValueWei);
        },
        handleKeydown(event) {
            const { input } = this.$refs;

            const numKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const currentInputValue = String(input.value);
            const caretPosition = input.selectionStart;
            const pressedKey = event.key;

            const eventHasModifiers = ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'].some(modifier => event[modifier] === true);
            const targetHasNoSelection = caretPosition === input.selectionEnd;
            const deletingBackward = event.key === 'Backspace' && !eventHasModifiers && targetHasNoSelection;
            const deletingForward = event.key === 'Delete' && !eventHasModifiers && targetHasNoSelection;
            const nextCharacterIsComma = currentInputValue[caretPosition] === ',';
            const previousCharacterIsComma = currentInputValue[caretPosition - 1] === ',';

            if (deletingForward && nextCharacterIsComma) {
                const preCommaInclusive = currentInputValue.slice(0, caretPosition + 1);
                const newPostComma = currentInputValue.slice(caretPosition + 2);

                this.setInputValue(preCommaInclusive.concat(newPostComma));
                this.setInputCaretPosition(caretPosition);

                return;
            }

            if (deletingBackward && previousCharacterIsComma) {
                const newPreComma = currentInputValue.slice(0, caretPosition - 2);
                const postCommaInclusive = currentInputValue.slice(caretPosition - 1);

                this.setInputValue(newPreComma.concat(postCommaInclusive));
                this.setInputCaretPosition(caretPosition);

                return;
            }

            const tryingToAddDigitsPastMaxPrecision = (() => {
                const valueSplitAtDecimal = currentInputValue.split(dot);
                const integer = valueSplitAtDecimal[0] ?? '';
                const fractional = valueSplitAtDecimal[1] ?? '';

                const keypressIsDigit = numKeys.includes(event.key);
                const caretIsPastDecimal = caretPosition > integer.length + 1;
                const fractionalUnderMaxLength = fractional.length < WEI_PRECISION;

                return keypressIsDigit && caretIsPastDecimal && !fractionalUnderMaxLength
            })();
            const tryingToAddSecondDot = pressedKey === dot && currentInputValue.includes(dot);
            const tryingToAddLeadingZeroes =
                pressedKey === '0' &&
                currentInputValue[0] === '0' &&
                [0, 1].includes(caretPosition);

            const invalidKeystroke =
                tryingToAddDigitsPastMaxPrecision ||
                tryingToAddSecondDot ||
                tryingToAddLeadingZeroes;


            if (invalidKeystroke)
                event.preventDefault();
        },
        handleInput() {
            const emit = val => (val !== this.value) && this.$emit('input', val);

            const { input } = this.$refs;

            this.setInputValue(
                String(input.value)
                    .replace(leadingZeroesRegex, '')
                    .replace(illegalCharsPrettyEthRegex, ''),
            );

            if (['', null, undefined, '0', '0.'].includes(input.value)) {
                emit('0');
                return;
            }

            if (input.value === dot) {
                emit('0');
                this.setInputValue('0.');
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

            const currentInputValue = input.value.replace(illegalCharsEthRegex, '') ?? '';

            // don't format or emit if the user is about to type a decimal
            if (currentInputValue[currentInputValue.length - 1] === dot && caretPosition === currentInputValue.length)
                return;

            let workingValue = currentInputValue;

            if (currentInputValue[0] === dot && caretPosition !== 0) {
                workingValue = '0'.concat(currentInputValue)
            }

            let workingValueAsWeiBn = parseUnits(workingValue, 'ether');

            if (!!this.maxValueWei && workingValueAsWeiBn.gt(this.maxValueWei)) {
                workingValue = formatEther(this.maxValueWei);
                workingValueAsWeiBn = parseUnits(workingValue, 'ether');
                caretPosition = workingValue.length;
            }

            const [integer, fractional = ''] = currentInputValue.split(dot);
            let savedTrailingFractionalZeroes = '';

            if (fractional.length) {
                const newFractional = fractional.substring(0, WEI_PRECISION);
                const trailingZeroes = newFractional.match(trailingZeroesRegex)?.[0] ?? '';
                workingValue = `${integer}.${newFractional}`;

                if (trailingZeroes.length)
                    savedTrailingFractionalZeroes = `${dot}trailingZeroes`;
            }

            this.setInputValue(
                commify(workingValue)
                    .replace(trailingDotZeroRegex, '')
                    .concat(savedTrailingFractionalZeroes),
            );

            const newCommaCount = (input.value.match(commaRegex) || []).length;
            const deltaCommaCount = newCommaCount - savedCommaCount;

            this.setInputCaretPosition(caretPosition + deltaCommaCount);
            emit(workingValueAsWeiBn.toString());
        },
        setInputValue(val) {
            this.$refs.input.value = val;
        },
        setInputCaretPosition(val) {
            ['Start', 'End'].forEach(property => this.$refs.input[`selection${property}`] = val)
        },
    },
}
</script>

<style lang="scss">
.c-staking-input {
    height: 104px;
    padding: 16px;
    border-radius: 10px;
    background-color: rgba($secondary, 0.03);

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
    }
}
</style>
