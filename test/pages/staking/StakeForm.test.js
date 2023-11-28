/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

const hash = '0x123';

// mocking antelope mocks XD
jest.mock('src/antelope/mocks', () => ({
    CURRENT_CONTEXT: 'current',
    useAccountStore: jest.fn().mockReturnValue({
        getAccount: jest.fn().mockReturnValue({
            authenticator: {
                signCustomTransaction: jest.fn().mockResolvedValue({ hash }),
            },
        }),
    }),
    useChainStore: jest.fn().mockReturnValue({
        currentChain: {
            settings: {
                getNetwork: jest.fn().mockReturnValue('network'),
            },
        },
    }),
    getAntelope: jest.fn().mockReturnValue({
        wallets: {
            getAuthenticator: jest.fn().mockReturnValue({
                newInstance: jest.fn().mockReturnValue({
                    signCustomTransaction: jest.fn().mockResolvedValue({ hash }),
                }),
            }),
        },
    }),
    createTraceFunction: jest.fn().mockReturnValue(() => {
        // do nothing
    }),
}));




import BaseStakingForm from 'pages/staking/BaseStakingForm';
import StakeForm from 'pages/staking/StakeForm';
import { PROVIDER_TELOS_CLOUD, PROVIDER_WEB3_INJECTED } from 'src/lib/utils';

const LocalStorageMap = {
    [PROVIDER_TELOS_CLOUD]: JSON.stringify({ provider: PROVIDER_WEB3_INJECTED }),
};

describe('StakeForm.vue', () => {
    let isLoggedInMock = jest.fn();
    let savedLocalStorage;

    const globalMock = () => ({
        directives: {
            'close-popup': () => {
                // do nothing
            },
        },
        plugins: [
            createStore({
                modules: {
                    login: {
                        namespaced: true,
                        getters: {
                            address: () => '0x'.concat('0'.repeat(40)),
                            isLoggedIn: isLoggedInMock,
                            isNative: () => false,
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
            'transaction-field': stubWithSlot('transaction-field'),
        },
    });
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
    beforeAll(() => {
        savedLocalStorage = global.localStorage;
    });

    beforeEach(() => {
        jest.resetAllMocks();
        isLoggedInMock.mockImplementation(() => true);
        Reflect.deleteProperty(global, 'localStorage');

        global.localStorage = {
            getItem: jest.fn().mockImplementation(key => LocalStorageMap[key]),
            setItem: jest.fn().mockImplementation((key, value) => {
                LocalStorageMap[key] = value;
            }),
            clear: jest.fn().mockImplementation(() => {
                Object.keys(LocalStorageMap).forEach((key) => {
                    delete LocalStorageMap[key];
                });
            }),
        };
        global.localStorage.setItem(PROVIDER_TELOS_CLOUD, JSON.stringify({ provider: PROVIDER_WEB3_INJECTED }));
    });

    afterAll(() => {
        global.localStorage = savedLocalStorage;
    });

    it('should have the correct name', () => {
        expect(StakeForm.name).toBe('StakeForm');
    });

    it('should render correctly when the user is not logged in', () => {
        isLoggedInMock.mockImplementation(() => false);
        const wrapper = shallowMount(StakeForm, {
            props:  { ...defaultProps },
            global: { ...globalMock()   },
        });

        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render a banner when the user has unlocked TLOS', async () => {
        const wrapper = shallowMount(StakeForm, {
            props:  { ...defaultProps },
            global: { ...globalMock()   },
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
                global: { ...globalMock()   },
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
        };

        ['top', 'bottom'].forEach((topOrBottom) => {
            test(`for the ${topOrBottom} input`, async() => {
                await runInputExpects(topOrBottom);
            });
        });
    });

    it('should set and get the value from localStorage', () => {
        localStorage.setItem(PROVIDER_TELOS_CLOUD, JSON.stringify({ provider: PROVIDER_WEB3_INJECTED }));
        expect(localStorage.getItem(PROVIDER_TELOS_CLOUD)).toEqual(JSON.stringify({ provider: PROVIDER_WEB3_INJECTED }));
    });

    it.skip('should render properly when the user has successfully staked TLOS', async () => {
        jest.useFakeTimers();
        stlosContractInstanceMock['depositTLOS()'].mockImplementationOnce(() => Promise.resolve({
            hash,
        }));

        // we need to execute the legacy implementation for depositing (depositTLOS())
        LocalStorageMap[PROVIDER_TELOS_CLOUD] = JSON.stringify({ provider: PROVIDER_WEB3_INJECTED });

        const wrapper = shallowMount(StakeForm, {
            props:  { ...defaultProps },
            global: { ...globalMock() },
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

        const confirmStakeButton = wrapper.findComponent('[label="pages.staking.stake_tlos"]');
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
