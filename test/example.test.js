import { mount } from '@vue/test-utils'

import Footer from 'components/Footer';

/*
    TODO https://github.com/telosnetwork/teloscan/issues/203
    
    add to docs:
    - snapshot testing
    - conventions for router / other plugins
    - test naming & nesting
    - directory structure of test directory
 */

describe('Example test', () => {
    it('should be able to find the Footer component', () => {
        const wrapper = mount(Footer, {
            global: {
                plugins: ['router'],
            },
        });

        expect(wrapper.element).toMatchSnapshot()
    });
});
