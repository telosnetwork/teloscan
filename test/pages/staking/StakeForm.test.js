import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

import { flushTimersAndPromises, oneEthInWei, onePointFiveEthInWei } from 'test/testing-helpers';

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
            'q-banner': { template: '<component is="q-banner-stub"> <slot /> <slot name="action" /> </component>'},
            'q-dialog': true,
            'q-card': true,
            'q-card-section': { template: '<component is="q-card-section-stub"> <slot /> </component>'},
            'q-card-actions': { template: '<component is="q-card-actions-stub"> <slot /> </component>'},
            'base-staking-form-stub': { template: '<component is="base-staking-form-stub"></component>'},
        },
    };
    const stlosContractInstanceMock = {
        previewDeposit: jest.fn(),
        previewRedeem: jest.fn(),
        ['depositTLOS()']: jest.fn(),
    };
    const defaultProps = {
        stlosContractInstance: { ...stlosContractInstanceMock },
        tlosBalance: '15',
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





    it('should handle user input events correctly', async () => {



    });


    it('should render properly when the user has successfully staked TLOS', () => {
        const wrapper = shallowMount(StakeForm, {
            props: { ...defaultProps },
            global: { ...globalMock },
        });

        //

        // display confirm modal
        // check mm logo?
        // submit
        // tx link
    });
});
