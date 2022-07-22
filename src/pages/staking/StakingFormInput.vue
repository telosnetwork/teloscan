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
                :value="prettyValue"
                type="text"
                pattern="[0-9]*"
                inputmode="numeric"
                placeholder="0"
                class="c-staking-input__input"
                @keydown="handleKeydown"
                @change="handleChange"
            >
        </div>
    </div>
</div>
</template>

<script>
import { ethers } from 'ethers';

import { WEI_PRECISION, isValidWeiString } from 'src/lib/utils';

export default {
    name: 'StakingFormInput',
    props: {
        value: {
            type: String,
            required: true,
            validator: str => isValidWeiString(str),
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
    },
    computed: {
        prettyValue() {
            const tlos = ethers.utils.formatEther(this.value)

            return ethers.utils.commify(tlos)
        },
    },
    methods: {
        handleKeydown(event) {
            const dot = '.';
            const numKeys = [
                '0',
                '1',
                '2',
                '3',
                '4',
                '5',
                '6',
                '7',
                '8',
                '9',
            ];
            const controlKeys = [
                'Backspace',
                'Delete',
                'Control',
                'Shift',
                'Alt',
                'Fn',
                'Meta',
                'ArrowUp',
                'ArrowDown',
                'ArrowLeft',
                'ArrowRight',
                'Tab',
            ];


            const isMaxLength = event.target.value
                .replaceAll('.', '')
                .replaceAll(',', '')
                .length >= WEI_PRECISION;

            const tryingToAddExtraDigits = isMaxLength && numKeys.includes(event.key);
            const tryingToAddSecondDot = event.key === dot && event.target.value.includes(dot);
            const illegalCharacter = ![...numKeys, ...controlKeys, dot].includes(event.key);

            const eventHasModifiers = ['altKey', 'shiftKey', 'ctrlKey', 'metaKey'].some(property => event[property] === true);

            const invalidKeystroke =
                tryingToAddExtraDigits ||
                tryingToAddSecondDot ||
                illegalCharacter;

            if (invalidKeystroke && !eventHasModifiers) {
                event.preventDefault();
            }
        },
        handleChange() { },
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
