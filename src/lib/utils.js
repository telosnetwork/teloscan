import {BigNumber} from "ethers";

export function formatBN(bn, tokenDecimals, displayDecimals) {
  const amount = BigNumber.from(bn);
  return `${(amount / Math.pow(10, tokenDecimals)).toFixed(displayDecimals)}`;
}

export function isValidAddressFormat(ethAddressString) {
  const pattern = /^0x[a-fA-F0-9]{40}$/;
  return pattern.test(ethAddressString);
}
