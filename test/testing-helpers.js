import { flushPromises } from "@vue/test-utils";

export const oneEthInWei                    =  `1${'0'.repeat(18)}`;
export const onePointFiveEthInWei           = `15${'0'.repeat(17)}`;
export const onePointOneEthInWei            = `11${'0'.repeat(17)}`;
export const oneHundredFiftyEthInWei        = `15${'0'.repeat(19)}`;
export const oneThousandFiveHundredEthInWei = `15${'0'.repeat(20)}`;

export const flushTimersAndPromises = async () => {
    jest.runAllTimers();
    await flushPromises();
}
