import { flushPromises } from '@vue/test-utils';

export const oneEthInWei                    =  `1${'0'.repeat(18)}`;
export const onePointFiveEthInWei           = `15${'0'.repeat(17)}`;
export const onePointOneEthInWei            = `11${'0'.repeat(17)}`;
export const oneHundredFiftyEthInWei        = `15${'0'.repeat(19)}`;
export const oneThousandFiveHundredEthInWei = `15${'0'.repeat(20)}`;

export const flushTimersAndPromises = async () => {
    jest.runAllTimers();
    await flushPromises();
};

/**
 * Creates a stub component with an unnamed slot and arbitrary named slots
 * For use in mount/shallowMount global options, e.g.
 *
 * const wrapper = shallowMount(SomeComponent, {
 *     global: {
 *         stubs: {
 *             'q-banner': stubWithSlot('q-banner', ['action']),
 *             'q-card': stubWithSlot('q-card')
 *         },
 *     },
 * });
 *
 * Note the <component is="component-name"> - this is to avoid a warning from jest that <component-name> is not a
 * recognized tag, while preserving the search-ability of the stub component using wrapper.findComponent
 *
 * @param {String}    componentName - name of the component in kebab-case
 * @param {String[]}  namedSlots    - the names of named the slots to be added
 * @param {Object}    options       - options to be added to the component
 *
 * @returns stub component with slot(s)
 */
export const stubWithSlot = (componentName, namedSlots = [], options = {}) => {
    const namedSlotsString = namedSlots.reduce(
        (slotNames, slotName) => slotNames.concat(`<slot name=${slotName} />\n`),
        '',
    );
    return {
        ...options,
        template: `
            <component is="${componentName}-stub">
                <slot />
                ${namedSlotsString}
            </component>
        `,
    };
};

