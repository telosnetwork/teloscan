import {BigNumber} from "ethers";

export function formatBN(bn, tokenDecimals, displayDecimals) {
  const amount = BigNumber.from(bn);
  return `${(amount / Math.pow(10, tokenDecimals)).toFixed(displayDecimals)}`;
}
