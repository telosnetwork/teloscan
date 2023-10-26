import { mount } from '@vue/test-utils';
import {
    oneEthInWei,
    oneHundredFiftyEthInWei,
    onePointFiveEthInWei,
    onePointOneEthInWei,
    oneThousandFiveHundredEthInWei,
} from 'test/testing-helpers';
import { BigNumber } from 'ethers';
import StakingFormInput from 'pages/staking/StakingFormInput';


const defaultProps = {
    modelValue: '',
    label: 'Label Text',
    infoText: '',
    errorText: '',
    tooltip: '',
    isLoading: false,
    maxValue: null,
};

const mountInput = props => mount(
    StakingFormInput,
    {
        global: {
            stubs: ['q-tooltip', 'q-icon'],
        },
        props: {
            ...defaultProps,
            ...props,
        },
    },
);


describe('StakingFormInput.vue', () => {
    it('should have the correct name', () => {
        expect(StakingFormInput.name).toBe('StakingFormInput');
    });

    describe('v-model implementation', () => {
        const getInputValue = wrapper => wrapper.find('input').element.value;

        const simulateUserInput = async (wrapper, key, newInputValue) => {
            const input = wrapper.find('input');
            // value represents the elements current value; this is a concatenation of all inputs,
            // where each input may be a single key or a pasted string. Thus, when calling this method,
            // the chronological order of simulated user input must be considered.
            // newInputValue is the input's value as the browser sets before triggering keydown or input handlers
            input.element.value = newInputValue;
            await input.trigger('keydown', { key });
            await input.trigger('input');
        };

        // check the emits, then simulates the flow of data back down to the component from parent via v-model
        // binding and ensures the component handles that update properly
        const checkInputExpectations = async (wrapper, expectedEmitCount, expectedLastEmitValue, expectedFormatted) => {
            const getEmittedVModel = () => wrapper.emitted()?.['update:modelValue'];

            expect(getEmittedVModel()?.length).toBe(expectedEmitCount);
            expect(getEmittedVModel()[expectedEmitCount - 1][0]).toBe(expectedLastEmitValue);

            await wrapper.setProps({ modelValue: expectedLastEmitValue });

            // input component should not emit after parent updates the modelValue,
            // i.e. should not enter feedback loop of emit and update
            expect(getInputValue(wrapper)).toBe(expectedFormatted);
            expect(getEmittedVModel()?.length).toBe(expectedEmitCount);

            expect(wrapper.element).toMatchSnapshot();
        };


        it('should warn when passed an invalid modelValue', () => {
            const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation(() => {
                // do nothing
            });
            const invalidValues = [
                undefined,
                null,
                'abc',
                123,
                0,
                BigNumber.from(123),
            ];

            // only strings of digits should mount with no warnings
            mountInput({ modelValue: '123' });
            mountInput({ modelValue: '0' });

            invalidValues.forEach(val => mountInput({ modelValue: val }));

            expect(consoleWarnMock).toHaveBeenCalledTimes(6);
        });

        it('should correctly handle a change in the modelValue prop', async () => {
            const wrapper = mountInput({ modelValue: '0' });
            expect(wrapper.emitted()['update:modelValue']).toBe(undefined);


            // update:modelValue event should only emit if value has been changed by the user,
            // but the input's value should still change and be formatted for the user:

            await wrapper.setProps({ modelValue: oneEthInWei });
            expect(wrapper.emitted()['update:modelValue']).toBe(undefined);
            expect(getInputValue(wrapper)).toEqual('1');

            await wrapper.setProps({ modelValue: onePointOneEthInWei });
            expect(wrapper.emitted()['update:modelValue']).toBe(undefined);
            expect(getInputValue(wrapper)).toEqual('1.1');

            await wrapper.setProps({ modelValue: '0' });
            expect(wrapper.emitted()['update:modelValue']).toBe(undefined);
            expect(getInputValue(wrapper)).toEqual('0');
        });

        it('should correctly handle user input', async () => {
            const wrapper = mountInput({ modelValue: '0' });
            let emitCounter = 0;

            // update:modelValue event should emit user input (in eth) as wei,
            // and the input's value should be formatted

            // single keypress: 1 => formatted value === "1"
            // a new modelValue should be emitted, as value changes from 0 to 1e+18 wei
            await simulateUserInput(wrapper, '1', '1');
            emitCounter++;
            await checkInputExpectations(wrapper, emitCounter, oneEthInWei, '1');

            // single keypress: 1 => formatted value === "1."
            // component should not emit as wei value has not changed from 1e+18 wei
            await simulateUserInput(wrapper, '.', '1.');
            await checkInputExpectations(wrapper, emitCounter, oneEthInWei, '1.');


            // single keypress: 5 => formatted value === "1.5"
            // component should emit as wei value has changed from 1e10^18 to 1.5e10^17 wei
            await simulateUserInput(wrapper, '5', '1.5');
            emitCounter++;
            await checkInputExpectations(wrapper, emitCounter, onePointFiveEthInWei, '1.5');

            // single keypress: 0 (inserted at end) => formatted value === "1.50"
            // component should not emit as wei value has not changed from 1.5e+17 wei
            await simulateUserInput(wrapper, '0', '1.50');
            await checkInputExpectations(wrapper, emitCounter, onePointFiveEthInWei, '1.50');

            // single keypress: 0 (inserted at beginning) => formatted value === "1.50" (leading zeroes stripped)
            // component should not emit as wei value has not changed from 1.5e+17 wei
            await simulateUserInput(wrapper, '0', '01.50');
            await checkInputExpectations(wrapper, emitCounter, onePointFiveEthInWei, '1.50');

            // single keypress: backspace (with the caret before the '.') => formatted value === "150"
            // component should emit as new wei value should be 1.5e+19 wei
            await simulateUserInput(wrapper, 'Delete', '150');
            emitCounter++;
            await checkInputExpectations(wrapper, emitCounter, oneHundredFiftyEthInWei, '150');

            // single keypress: 0 (inserted at end) => formatted value === "1,500"
            // component should emit as new wei value should be 1.5e+20 wei
            await simulateUserInput(wrapper, '0', '1500');
            emitCounter++;
            await checkInputExpectations(wrapper, emitCounter, oneThousandFiveHundredEthInWei, '1,500');

            // single keypress: 0 (with all selected) => formatted value === "0"
            // component should emit as new wei value should be 0 wei
            await simulateUserInput(wrapper, '0', '0');
            emitCounter++;
            await checkInputExpectations(wrapper, emitCounter, '0', '0');
        });
    });
});
