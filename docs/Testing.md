🛠️ This documentation is under construction while we build v1 of our testing practices 🛠️

# Table of Contents
1. [Introduction: Testing](#intro)
2. [Directory Structure](#directory-structure)
3. [Style and Other Conventions](#conventions)
4. [Snapshots](#snapshots)
5. [Tips](#tips)
<hr></hr>

## Testing <a name="#intro"></a>
In this repo, unit testing is conducted using [Jest](https://jestjs.io/). Unit tests are used to ensure that individual
components (including utilities) in the application work as expected independent of the context they are used in.
They are not meant to cover scenarios of nested components structures or complex user interactions
(called Integration and E2E testing, respectively). Unit tests also do not test the internal
workings of a component. Unit tests should interact with a component or method from the outside, treating it like a
'black box', written in terms of input and output, e.g.
- _when prop A changes, the markup rendered by the component should include a stub of component B_
- _when a user clicks the Submit button, ComponentA should emit the "submit" event_
- _when passed a value of X for parameter A, value Y should be returned_

Unit tests should not check whether some internal method (e.g. ComponentA.methodB) was called, such as in
response to a prop changing. In general, unit tests for components which have child components in their markup should be run as shallow tests
(using `shallowMount`, `stubs`, and/or `mocks`) with all of their children Vue components rendered as stubs.


### Directory Structure <a name="#directory-structure"></a>
The `test/` directory should mirror the `src/` directory. Tests themselves should be named `[file].test.js`,
where `[file]` is the same as the source file _without its file extension_.

So, the unit tests for the Vue component `src/pages/staking/BaseStakeForm.vue`
should be placed in `test/pages/staking/BaseStakeForm.test.js`

and for the utilities in `src/components/ContractTab/function-interface-utils.js`, tests should be placed in
`test/components/ContractTab/function-interface-utils.test.js`

Files named properly will automatically be included in coverage and git pre-push hooks.

### Best practices <a name="#conventions"></a>
- Component (`*.vue` files) tests should always contain a test for its `name`
    ```js
    // ✅ Good
    import ComponentA from 'src/components/componentA.vue';

    describe('ComponentA', () => {
        it('should have the correct name', () => {
            expect(ComponentA.name).toBe('ComponentA');
        });
    });
    ```
- Test cases should be nested in a way which produces an intelligible sentence, e.g.
    ```js
    // ✅ Good
    describe('ComponentA', () => {
        describe('when the user clicks on the Submit button', () => {
            beforeEach(() => {
                // some setup for this describe block
            });

            it('should emit the "input" event if propB is true', () => {
                // ...
            });

            it('should not emit anything if propA is false', () => {
                // ...
            });
        });
    });
    ```
- `describe` and `it`/`test` blocks should generally be nested no more than 3 levels
- when checking if a particular event has been emitted or mock called, always check the length of the relevant array.
It isn't enough to check that an event has been emitted, it should also be emitted the correct number of times.
Tests get difficult to debug without this, and unwanted emits/calls may lead to unwanted behavior in a parent component.
    ```js
    // ✅ Good
    expect(wrapper.emitted()['update:modelValue'].length).toBe(4);
    expect(wrapper.emitted()['update:modelValue'][3]).toBe('some value');

    // ✅ Good
    expect(someMockFunction).toHaveBeenCalledTimes(1);
    expect(someMockFunction).toHaveBeenLastCalledWith('a value');
    ```


### Snapshots <a name="#snapshots"></a>
TODO

### Tips <a name="#tips"></a>
- **TODO working with quasar components**
- all Quasar components will need to be manually added or stubbed via `stubs`
- make sure when viewing `vue-test-utils` documentation that the root URL is https://test-utils.vuejs.org. Search results
often direct you to the docs for v1 (for Vue 2) which will lead to unexpected errors. The links to go to the correct
documentation from `v1` docs are broken at the time of writing this.
- some `vue-test-utils` methods, especially those changing the state of a component in some way
(e.g. `setProps` and `trigger`) must be `await`ed. If they are executed without `await`, it is possible for the
execution of the test to be out of order, resulting in invalid `expect`s. These methods are noted in the
`vue-test-utils` documentation, e.g. https://test-utils.vuejs.org/api/#setprops
    ```js
    // ⛔ BAD - do not do this!
    it('does not emit "some-event" when passed someData === "newValue"', () => {
        const wrapper = mount(SomeComponent);
        wrapper.setProps({ someData: 'new value' }); // not awaited

        // this expect can pass incorrectly; even if the component erroneously emits 'some-event', the component has
        // not yet updated. Thus wrapper.emitted()['some-event'].length will still be 0, leading to a missed error
        expect(wrapper.emitted()['some-event'].length).toBe(0);

        // now at the end of the call stack, wrapper.emitted()['some-event'].length is incremented from 0 to 1
        // Test passes when it should have failed
    });
    ```

    ```js
    // ✅ Good - async/await has been added
    it('does not emit "some-event" when passed someData === "newValue"', async () => { // async added to the arrow function
        const wrapper = mount(SomeComponent);
        await wrapper.setProps({ someData: 'new value' }); // awaited

        expect(wrapper.emitted()['some-event'].length).toBe(0);

        // Test fails: "Expected wrapper.emitted()['some-event'].length to be 0, instead got 1"
    });
    ```
- it is helpful to sanity check newly written tests which are passing, which can be done by
forcing a test failure (such as by changing the markup in a vue file so the snapshot test fails). This is especially
helpful to catch places where a wrapper method is treated erroneously like an attribute,
e.g. `expect(wrapper.emitted.input[1]).toBe('987');` will always fail, because `emitted` is a function, thus
`emitted.input` is always undefined. It should be called like so, with parentheses:
`expect(wrapper.emitted().input[1]).toBe('987');`

###
