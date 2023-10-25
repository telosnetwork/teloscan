import { BigNumber, ethers } from 'ethers';
import moment from 'moment';
import keccak from 'keccak';
const REVERT_FUNCTION_SELECTOR = '0x08c379a0';
const REVERT_PANIC_SELECTOR = '0x4e487b71';

export const WEI_PRECISION = 18;
export const DISPLAY_DECIMALS = 4;
export const LOGIN_EVM = 'evm';
export const LOGIN_NATIVE = 'native';
export const PROVIDER_WEB3_INJECTED = 'injectedWeb3';
export const PROVIDER_TELOS_CLOUD = 'OreId';
export const PROVIDER_WALLET_CONNECT = 'WalletConnect';
export const PROVIDER_METAMASK = 'Metamask';
export const PROVIDER_BRAVE = 'Brave';
export const PROVIDER_SAFEPAL = 'SafePal';
export const LOGIN_DATA_KEY = 'loginData';
export const DEFAULT_CHAIN_ID = '40'; // Telos Mainnet

export function formatWei(bn, tokenDecimals, displayDecimals) {
    const amount = BigNumber.from(bn);
    const formatted = ethers.utils.formatUnits(amount.toString(), (tokenDecimals || WEI_PRECISION));
    let str = formatted.toString();
    // Use string, do not convert to number so we never loose precision
    if(displayDecimals > 0 && str.includes('.')) {
        const parts = str.split('.');
        return parts[0] + '.' + parts[1].slice(0, displayDecimals);
    }
    return str;
}
export function isValidAddressFormat(ethAddressString) {
    const pattern = /^0x[a-fA-F0-9]{40}$/;
    return pattern.test(ethAddressString);
}

export function getTopicHash(topic)  {
    return `0x${topic.substring(topic.length - 40)}`;
}

export function formatIsoDateTime(dateTimezone) {
    return moment(dateTimezone).utc().format('DD/MM/YYYY');
}

export function toChecksumAddress(address) {
    if (!address) {
        return address;
    }

    let addy = address.toLowerCase().replace('0x', '');
    if (addy.length !== 40) {
        addy = addy.padStart(40, '0');
    }

    let hash = keccak('keccak256').update(addy).digest('hex');
    let ret = '0x';

    for (let i = 0; i < addy.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += addy[i].toUpperCase();
        } else {
            ret += addy[i];
        }
    }

    return ret;
}

export function parseErrorMessage(output) {
    if (!output) {
        return;
    }

    let message = '';
    if (output.startsWith(REVERT_FUNCTION_SELECTOR)) {
        message = parseRevertReason(output);
    }

    if (output.startsWith(REVERT_PANIC_SELECTOR)) {
        message = parsePanicReason(output);
    }


    return message.replace(/[^a-zA-Z0-9 /./'/"/,/@/+/-/_/(/)/[]/g, '');
}

export function parseRevertReason(revertOutput) {
    if (!revertOutput || revertOutput.length < 138) {
        return '';
    }

    let reason = '';
    let trimmedOutput = revertOutput.substr(138);
    for (let i = 0; i < trimmedOutput.length; i += 2) {
        reason += String.fromCharCode(parseInt(trimmedOutput.substr(i, 2), 16));
    }
    return reason;
}

export function parsePanicReason(revertOutput) {
    let trimmedOutput = revertOutput.slice(-2);
    let reason;

    switch (trimmedOutput) {
    case '01':
        reason = 'If you call assert with an argument that evaluates to false.';
        break;
    case '11':
        reason = 'If an arithmetic operation results in underflow or overflow outside of an unchecked { ... } block.';
        break;
    case '12':
        reason = 'If you divide or modulo by zero (e.g. 5 / 0 or 23 % 0).';
        break;
    case '21':
        reason = 'If you convert a value that is too big or negative into an enum type.';
        break;
    case '31':
        reason = 'If you call .pop() on an empty array.';
        break;
    case '32':
        reason = 'If you access an array, bytesN or an array slice at an out-of-bounds or negative index ' +
            '(i.e. x[i] where i >= x.length or i < 0).';
        break;
    case '41':
        reason = 'If you allocate too much memory or create an array that is too large.';
        break;
    case '51':
        reason = 'If you call a zero-initialized variable of internal function type.';
        break;
    default:
        reason = 'Default panic message';
    }
    return reason;
}

export function sortAbiFunctionsByName(fns) {
    return fns.sort(
        ({ name: nameA }, { name: nameB }) => {
            const upperA = nameA.toUpperCase();
            const upperB = nameB.toUpperCase();
            return (upperA < upperB) ? -1 : (upperA > upperB) ? 1 : 0;
        });
}

export function getRouteWatcherForTabs(routeName, tabs, defaultTab) {
    return {
        immediate: true,
        deep: true,
        handler(newRoute, oldRoute = {}) {
            if (newRoute !== oldRoute) {
                const { hash: newHash } = newRoute;

                if (newRoute.name !== routeName || !newHash) {
                    return;
                }

                const tabHashes = Object.values(tabs);
                const newHashIsInvalid = !tabHashes.includes(newHash);

                if (newHashIsInvalid) {
                    this.$router.replace({ hash: defaultTab });
                }
            }
        },
    };
}

/**
 * Determine whether the user's device is an Apple touch device
 *
 * @return {boolean}
 */
export function getClientIsApple() {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod',
    ].includes(navigator.platform)
        // iPad on iOS 13 detection
        || (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
}

/**
 * Given a Date object, return the pretty-printed timezone offset, e.g. "+05:00"
 *
 * @param {Date} date
 * @return {string}
 */
export function getFormattedUtcOffset(date) {
    const pad = value => value < 10 ? '0' + value : value;
    const sign = (date.getTimezoneOffset() > 0) ? '-' : '+';
    const offset = Math.abs(date.getTimezoneOffset());
    const hours = pad(Math.floor(offset / 60));
    const minutes = pad(offset % 60);
    return sign + hours + ':' + minutes;
}
