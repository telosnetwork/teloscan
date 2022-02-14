import {BigNumber} from "ethers";
import moment from "moment";
const createKeccakHash = require('keccak')

export function formatBN(bn, tokenDecimals, displayDecimals) {
  const amount = BigNumber.from(bn);
  return `${(amount / Math.pow(10, tokenDecimals)).toFixed(displayDecimals)}`;
}

export function isValidAddressFormat(ethAddressString) {
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(ethAddressString);
}

export function formatIsoDateTime(dateTimezone){
 return moment(dateTimezone).utc().format('DD/MM/YYYY');
}

export function toChecksumAddress(address) {
  if (!address)
      return address

  address = address.toLowerCase().replace('0x', '')
  if (address.length != 40)
      address = address.padStart(40, "0");

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