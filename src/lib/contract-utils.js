/**
 * Ensure that empty contracts are added to the cache
 *
 * @param {Object} contractManager - global contract manager
 * @param {Array} contracts - the contracts object returned by an indexer call
 * @param {Object} transaction - a transaction object returned by an indexer call
 */
export function addEmptyContractToCache(contractManager, contracts, transaction) {
    let found_to = 0;
    let found_from = 0;

    for (const contract in contracts) {
        if (contract.toLowerCase() === transaction.to.toLowerCase()) {
            found_to++;
        }
        if (contract.toLowerCase() === transaction.from.toLowerCase()) {
            found_from++;
        }
    }
    if (found_from === 0) {
        contractManager.addContractToCache(transaction.from, { 'address': transaction.from });
    }
    if (found_to === 0) {
        contractManager.addContractToCache(transaction.to, { 'address': transaction.to });
    }
}
