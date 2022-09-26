import { boot } from 'quasar/wrappers'
import { QTooltip } from 'quasar';

const setDefault = (component, key, value) => {
    const prop = component.props[key];
    switch (typeof prop) {
    case 'object':
        prop.default = value;
        break;
    case 'function':
        component.props[key] = {
            type: prop,
            default: value,
        };
        break;
    case 'undefined':
        throw new Error('unknown prop: ' + key);
    default:
        throw new Error('unhandled type: ' + typeof prop);
    }
};

// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot((/* { app, router, ... } */) => {
    // https://github.com/quasarframework/quasar/discussions/8761#discussioncomment-1042529
    // This addresses an issue with q-tooltip where the tooltip disappears almost instantly on mobile,
    // while behaving as expected on desktop. Adding the hide-delay prop fixes mobile, but makes tooltips
    // behave incorrectly (delaying tooltip close after mouseleave) for desktop. This solution is to simply set
    // the default hide delay based on touch vs non-touch client. This value can then be overridden per-instance if
    // required, as this only changes the default prop value
    const isTouchDevice = ( 'ontouchstart' in window ) ||
        ( navigator.maxTouchPoints > 0 ) ||
        ( navigator.msMaxTouchPoints > 0 );

    const tooltipHideDelay =  isTouchDevice ? 9999999 : undefined;
    setDefault(QTooltip, 'hideDelay', tooltipHideDelay);
})
