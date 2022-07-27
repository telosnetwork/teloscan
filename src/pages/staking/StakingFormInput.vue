<template>
<div class="c-staking-input container-fluid shadow-3">
    <div class="row">
        <div class="col-6">
            <h6 class="c-staking-input__label">
                {{ label }}
            </h6>
        </div>
        <div
            v-if="infoText"
            :class="`col-6 text-right q-pt-sm ${hasError ? 'text-red' : ''}`"
        >
            {{ infoText }}
        </div>
    </div>
    <div class="row">
        <div class="col">
            <input
                ref="input"
                type="text"
                pattern="[0-9]*"
                inputmode="numeric"
                placeholder="0"
                class="c-staking-input__input"
                @keydown="handleKeydown"
                @input="handleInput"
            >
        </div>
    </div>
</div>
</template>

<script>
import { BigNumber, ethers } from 'ethers';

import { WEI_PRECISION, isValidWeiString } from 'src/lib/utils';

export default {
    name: 'StakingFormInput',
    props: {
        value: {
            type: String,
            required: true,
            validator: str => isValidWeiString(str), // eztodo switch util to use BigNumber try/catch
        },
        label: {
            type: String,
            required: true,
        },
        infoText: {
            type: String,
            default: '',
        },
        hasError: {
            type: Boolean,
            required: true,
        },
        isLoading: {
            // eztodo add loading state
            type: Boolean,
            required: true,
        },
        maxValueWei: {
            type: String,
            required: true,
            validator: str => BigNumber.from(str),
        },
    },
    // watch: {
    //     value(newVal, oldVal) {
    //         if (newVal !== oldVal) {
    //             try {
    //                 const eth = ethers.utils.formatEther(BigNumber.from(newVal));
    //                 this.$refs.input.value = ethers.utils.commify(eth);
    //             } catch (e) {
    //                 console.error(e.message);
    //             }
    //         }
    //     },
    // },
    methods: {
        handleKeydown(event) {
            const dot = '.';
            const numKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
            const currentInputValue = String(event.target.value);
            const caretPosition = event.target.selectionStart;
            const pressedKey = event.key;

            const eventHasModifiers = ['ctrlKey', 'metaKey', 'shiftKey', 'altKey'].some(modifier => event[modifier] === true);
            const targetHasNoSelection = caretPosition === event.target.selectionEnd;
            const deletingBackward = event.key === 'Backspace' && !eventHasModifiers && targetHasNoSelection;
            const deletingForward = event.key === 'Delete' && !eventHasModifiers && targetHasNoSelection;
            const nextCharacterIsComma = currentInputValue[caretPosition] === ',';
            const previousCharacterIsComma = currentInputValue[caretPosition - 1] === ',';


            if (deletingForward && nextCharacterIsComma) {
                const preCommaInclusive = currentInputValue.slice(0, caretPosition + 1);
                const newPostComma = currentInputValue.slice(caretPosition + 2);

                event.target.value = preCommaInclusive.concat(newPostComma);
                event.target.selectionStart = caretPosition;
                event.target.selectionEnd = caretPosition;

                return;
            }

            if (deletingBackward && previousCharacterIsComma) {
                const newPreComma = currentInputValue.slice(0, caretPosition - 2);
                const postCommaInclusive = currentInputValue.slice(caretPosition - 1);

                event.target.value = newPreComma.concat(postCommaInclusive);
                event.target.selectionStart = caretPosition;
                event.target.selectionEnd = caretPosition;

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
        handleInput(event) {
            if (['', null, '0', '0.'].includes(event.target.value)) {
                // eztodo emit 0?
                return;
            }

            if (event.target.value === '.') {
                // eztodo emit 0?
                event.target.value = '0.';
                return;
            }

            const dot = '.';
            const illegalCharactersRegex = /[^0-9.]/g;
            const illegalCharactersRegexPretty = /[^0-9,.]/g;
            const leadingZeroesRegex = /^0+/g;
            const trailingZeroesRegex = /0+$/g
            const commaRegex = /[,]/g;
            const dotRegex = /[.]/g;

            const savedCaretPosition = event.target.selectionStart;
            const savedCommaCount = (event.target.value.match(commaRegex) || []).length;

            event.target.value = String(event.target.value)
                .replace(leadingZeroesRegex, '')
                .replace(illegalCharactersRegexPretty, '');

            // remove extraneous dots not handled in keydownHandler (ie. from pasted values)
            if ((event.target.value?.match(dotRegex) ?? []).length > 1) {
                const { value } = event.target;
                const afterFirstDotIndex = value.indexOf(dot) + 1;
                const int = value.slice(0, afterFirstDotIndex);
                const fractional = value.slice(afterFirstDotIndex).replaceAll(dot, '');
                event.target.value = int.concat(fractional);
            }

            const currentInputValue = event.target.value.replace(illegalCharactersRegex, '');

            const caretPosition = event.target.selectionStart;

            // don't format or emit if the user is about to type a decimal
            if (currentInputValue[currentInputValue.length - 1] === dot)
                return;

            let workingValue = currentInputValue;

            // eztodo is this a duplicate of :151 ?
            if (currentInputValue[0] === dot && caretPosition !== 0) {
                workingValue = '0'.concat(currentInputValue)
            }

            const [integer, fractional = ''] = currentInputValue.split(dot);
            const savedTrailingZeroes = fractional.match(trailingZeroesRegex);

            if (fractional.length > WEI_PRECISION) {
                const newFractional = fractional.substring(0, WEI_PRECISION);
                workingValue = `${integer}.${newFractional}`;
            }

            const workingValueAsWei = ethers.utils.parseUnits(workingValue, 'ether');

            if (workingValueAsWei.gt(this.maxValueWei))
                workingValue = ethers.utils.formatEther(this.maxValueWei);

            const eth = workingValue;

            // trailing zeroes still needs massaging - only works for zeroes directly after dot
            event.target.value = ethers.utils.commify(eth).replace(trailingZeroesRegex, savedTrailingZeroes);
            // 18 characters: /^\d{0,18}/g


            const newCommaCount = (event.target.value.match(commaRegex) || []).length;
            const deltaCommaCount = newCommaCount - savedCommaCount;

            event.target.selectionStart = savedCaretPosition + deltaCommaCount;
            event.target.selectionEnd = savedCaretPosition + deltaCommaCount;
        },
    },
}
</script>

<style lang="scss">
.c-staking-input {
    padding: 16px;
    border-radius: 10px;
    background-color: rgba($secondary, 0.03);

    &__label {
        margin: 0;
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
