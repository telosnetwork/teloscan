import { shallowMount } from '@vue/test-utils';
import { BigNumber } from 'ethers';
import { createStore } from 'vuex';

import {
    flushTimersAndPromises,
    oneEthInWei,
    oneHundredFiftyEthInWei,
    onePointFiveEthInWei,
    stubWithSlot,
} from 'test/testing-helpers';

import BaseStakingForm from 'pages/staking/BaseStakingForm';
import StakeForm from 'pages/staking/StakeForm';


describe('StakeForm.vue', () => {
    let isLoggedInMock = jest.fn(() => true);
    const globalMock = {
        directives: {
            'close-popup': () => {},
        },
        plugins: [
            createStore({
                modules: {
                    login: {
                        namespaced: true,
                        getters: {
                            address: () => '0x'.concat('0'.repeat(40)),
                            isLoggedIn: isLoggedInMock,
                        },
                    },
                },
            }),
        ],
        stubs: {
            'q-btn': true,
            'q-banner': stubWithSlot('q-banner', ['action']),
            'q-card': stubWithSlot('q-card'),
            'q-card-section': stubWithSlot('q-card-section'),
            'q-card-actions': stubWithSlot('q-card-actions'),
            'q-dialog':  stubWithSlot('q-dialog'),
            'transaction-field': stubWithSlot('transaction-field', undefined),
        },
    };
    const stlosContractInstanceMock = {
        previewDeposit: jest.fn(),
        previewRedeem: jest.fn(),
        ['depositTLOS()']: jest.fn(),
    };
    const defaultProps = {
        stlosContractInstance: { ...stlosContractInstanceMock },
        tlosBalance: oneHundredFiftyEthInWei,
        hasUnlockedTlos: false,
        unstakePeriodSeconds: 60,
        valueOfOneStlosInTlos: '1.23456789',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        isLoggedInMock.mockImplementation(() => true);
    });

    it('should have the correct name', () => {
        expect(StakeForm.name).toBe('StakeForm');
    });

    it('should render correctly when the user is not logged in', async () => {
        isLoggedInMock.mockImplementation(() => false);
        const wrapper = shallowMount(StakeForm, {
            props:  { ...defaultProps },
            global: { ...globalMock   },
        });

        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render a banner when the user has unlocked TLOS', async () => {
        const wrapper = shallowMount(StakeForm, {
            props:  { ...defaultProps },
            global: { ...globalMock   },
        });

        // no banner
        expect(wrapper.element).toMatchSnapshot();

        await wrapper.setProps({ hasUnlockedTlos: true });

        // snapshot contains q-banner-stub
        expect(wrapper.element).toMatchSnapshot();
    });

    describe('user input should be correctly handled', () => {
        jest.useFakeTimers();
        let wrapper;
        let formStub;

        beforeEach(() => {
            jest.clearAllMocks();
            wrapper = shallowMount(StakeForm, {
                props:  { ...defaultProps },
                global: { ...globalMock   },
            });
            formStub = wrapper.findComponent(BaseStakingForm);
        });

        const runInputExpects = async (topOrBottomInput) => {
            const mockedContractMethod = topOrBottomInput === 'top' ? 'previewDeposit' : 'previewRedeem';
            const eventToSimulateUserInput = `input-${topOrBottomInput}`;

            // mock 1 TLOS === 1.5 STLOS
            stlosContractInstanceMock[mockedContractMethod]
                .mockImplementationOnce(() => Promise.resolve(onePointFiveEthInWei));

            formStub.vm.$emit(eventToSimulateUserInput, oneEthInWei);
            await flushTimersAndPromises();

            expect(stlosContractInstanceMock[mockedContractMethod]).toHaveBeenCalledTimes(1);
            expect(stlosContractInstanceMock[mockedContractMethod]).toHaveBeenLastCalledWith(oneEthInWei);
            expect(wrapper.element).toMatchSnapshot();


            stlosContractInstanceMock[mockedContractMethod]
                .mockImplementationOnce(() => Promise.resolve('0'));

            formStub.vm.$emit(eventToSimulateUserInput, '0');
            await flushTimersAndPromises();

            expect(stlosContractInstanceMock[mockedContractMethod]).toHaveBeenCalledTimes(2);
            expect(stlosContractInstanceMock[mockedContractMethod]).toHaveBeenLastCalledWith('0');
            expect(wrapper.element).toMatchSnapshot();
        }

        ['top', 'bottom'].forEach((topOrBottom) => {
            test(`for the ${topOrBottom} input`, async() => {
                await runInputExpects(topOrBottom);
            })
        });
    });

    it('should render properly when the user has successfully staked TLOS', async () => {
        jest.useFakeTimers();
        stlosContractInstanceMock['depositTLOS()'].mockImplementationOnce(() => Promise.resolve({
            hash: '0x123',
        }));

        const wrapper = shallowMount(StakeForm, {
            props:  { ...defaultProps },
            global: { ...globalMock   },
        });
        const formStub = wrapper.findComponent(BaseStakingForm);

        // mock 1 TLOS === 1.5 STLOS
        stlosContractInstanceMock.previewDeposit
            .mockImplementationOnce(() => Promise.resolve(onePointFiveEthInWei));

        formStub.vm.$emit('input-top', oneEthInWei);
        await flushTimersAndPromises();
        expect(wrapper.element).toMatchSnapshot();

        await formStub.vm.$emit('cta-clicked');

        // q-dialog expects a boolean v-model binding to show/hide the element
        expect(wrapper.element).toMatchSnapshot();

        const confirmStakeButton = wrapper.findComponent('[label="Stake TLOS"]');
        confirmStakeButton.vm.$emit('click');

        expect(stlosContractInstanceMock['depositTLOS()']).toHaveBeenCalledTimes(1);
        expect(stlosContractInstanceMock['depositTLOS()']).toHaveBeenLastCalledWith({
            value: BigNumber.from(oneEthInWei),
        });

        await flushTimersAndPromises();
        expect(wrapper.emitted('balance-changed').length).toBe(1);

        // should now have a <transaction-field-stub ... />
        expect(wrapper.element).toMatchSnapshot();
    });
});
