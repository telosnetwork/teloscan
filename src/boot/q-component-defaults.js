import { boot } from 'quasar/wrappers';
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
// Method 3: Modernizer way
function isTouchDevice() {
    var prefixes = ' -webkit- -moz- -o- -ms- '.split(' ');
    var mq = function(query) {
        return window.matchMedia(query).matches;
    };

    if (('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch) {
        return true;
    }

    // include the 'heartz' as a way to have a non matching MQ to help terminate the join
    // https://git.io/vznFH
    var query = ['(', prefixes.join('touch-enabled),('), 'heartz', ')'].join('');
    return mq(query);
}
// more info on params: https://v2.quasar.dev/quasar-cli/boot-files
export default boot((/* { app, router, ... } */) => {
    // Metamask quick fix (redirects assets info to /token instead of /address), to replace with real 301 once SSR
    if(window.location.href.includes('/token/0x')){
        window.location.href = window.location.href.replace('/token/', '/address/');
    }
    // https://github.com/quasarframework/quasar/discussions/8761#discussioncomment-1042529
    // This addresses an issue with q-tooltip where the tooltip disappears almost instantly on mobile,
    // while behaving as expected on desktop. Adding the hide-delay prop fixes mobile, but makes tooltips
    // behave incorrectly (delaying tooltip close after mouseleave) for desktop. This solution is to simply set
    // the default hide delay based on touch vs non-touch client. This value can then be overridden per-instance if
    // required, as this only changes the default prop value
    const tooltipHideDelay =  isTouchDevice() ? 9999999 : undefined;
    setDefault(QTooltip, 'hideDelay', tooltipHideDelay);
});
