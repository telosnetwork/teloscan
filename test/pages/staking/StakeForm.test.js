import { shallowMount } from '@vue/test-utils';
import StakeForm from 'pages/staking/StakeForm';
import { createStore } from 'vuex';


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
        jest.restoreAllMocks();
        isLoggedInMock = jest.fn();
    });

    it('should have the correct name', () => {
        expect(StakeForm.name).toBe('StakeForm');
    });


    it('should render properly when the user is not logged in', async () => {
        isLoggedInMock.mockImplementation(() => false);
        const wrapper = shallowMount(StakeForm, {
            props: { ...defaultProps },
            global: { ...globalMock },
        });

        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render a banner when the user has unlocked TLOS', async () => {
        // isLoggedInMock.mockImplementation(() => true);
        const wrapper = shallowMount(StakeForm, {
            props: { ...defaultProps },
            global: { ...globalMock },
        });

        // no banner
        expect(wrapper.element).toMatchSnapshot();

        await wrapper.setProps({ hasUnlockedTlos: true });

        // snapshot contains q-banner-stub
        expect(wrapper.element).toMatchSnapshot();
    });

    it('should render properly when the user has successfully staked TLOS', () => {
        // display confirm modal
        // check mm logo?
        // submit
        // tx link
    });
});
