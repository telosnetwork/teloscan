import { shallowMount } from '@vue/test-utils'

import Footer from 'components/Footer';

describe('Example test', () => {
    it('should be able to find the Footer component', () => {
        const wrapper = shallowMount(Footer, {
            global: {
                stubs: ['router-link'],
            },
        });

        expect(wrapper.text()).toContain('2022')
    });
});
