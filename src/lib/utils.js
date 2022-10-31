import { BigNumber } from 'ethers';
import moment from 'moment';
const createKeccakHash = require('keccak')
const REVERT_FUNCTION_SELECTOR = '0x08c379a0'
const REVERT_PANIC_SELECTOR = '0x4e487b71'

export const WEI_PRECISION = 18;

export function formatWei(bn, tokenDecimals, displayDecimals) {
    const amount = BigNumber.from(bn);
    const formatted = amount / 10 ** tokenDecimals;
    let str = formatted.toString();
    if(displayDecimals && str.includes('.')) {
        const parts = str.split('.');
        return parts[0] + '.' + parts[1].slice(0, displayDecimals);
    }
    return str;
}

export function isValidAddressFormat(ethAddressString) {
    const pattern = /^0x[a-fA-F0-9]{40}$/;
    return pattern.test(ethAddressString);
}

export function formatIsoDateTime(dateTimezone) {
    return moment(dateTimezone).utc().format('DD/MM/YYYY');
}

export function toChecksumAddress(address) {
    if (!address)
        return address

    address = address.toLowerCase().replace('0x', '')
    if (address.length != 40)
        address = address.padStart(40, '0');

    let hash = createKeccakHash('keccak256').update(address).digest('hex')
    let ret = '0x'

    for (var i = 0; i < address.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += address[i].toUpperCase()
        } else {
            ret += address[i]
        }
    }

    return ret
}

export function parseErrorMessage(output) {
    if (!output)
        return;

    let message;
    if (output.startsWith(REVERT_FUNCTION_SELECTOR))
        message = parseRevertReason(output);

    if (output.startsWith(REVERT_PANIC_SELECTOR))
        message = parsePanicReason(output);


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
    let trimmedOutput = revertOutput.slice(-2)
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
        reason = 'If you access an array, bytesN or an array slice at an out-of-bounds or negative index (i.e. x[i] where i >= x.length or i < 0).';
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
