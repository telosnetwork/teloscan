import { contractManager, indexerApi } from 'src/boot/telosApi';
import { ZERO_ADDRESSES, formatWei } from 'src/lib/utils';
import { addEmptyContractToCache } from 'src/lib/contract-utils';
import { formatTimestamp } from 'src/lib/date-utils';
import { EXPORT_DOWNLOAD_TYPES } from 'src/lib/constants';

import { EvmTransaction, EvmTransfer, IndexerContractData } from 'src/antelope/types/EvmTransaction';

/**
 * Escape a string value which is meant to be entered into a CSV
 *
 * @param value The value to escape
 * @returns The escaped value
 */
function escapeCSVValue(value: string) {
    let escapedVal = value;

    if (
        escapedVal.includes(',')
        || escapedVal.includes('\n')
        || escapedVal.includes('"')
    ) {
        escapedVal = `"${escapedVal.replace(/"/g, '""')}"`; // Escape quotes
    }

    return value;
}

/**
 * Download a CSV file of transactions
 *
 * @param $t The translation function
 * @param limit The number of transactions to download
 * @param exportType The type of export to download
 * @param accountAddress The account address to download transactions for
 * @param dateRange The date range to download transactions for
 * @param blockRange The block range to download transactions for
 * @returns A promise which resolves when the download is complete
 */
export async function downloadCsv(
    // eslint-disable-next-line no-unused-vars
    $t: (slug: string) => string,
    limit: number,
    exportType: string,
    accountAddress: string,
    dateRange: { to: string | null, from: string | null },
    blockRange: { startBlock: string | null, endBlock: string | null },
) {
    let csvContent = '';
    let fileName = '';

    function appendFilters(url: string, extras?: string) {
        let returnUrl = `${url}?limit=${limit}${extras ? `&${extras}` : ''}&`;
        if (dateRange.from && dateRange.to) {
            const startTime = (new Date(dateRange.from)).getTime();
            const endTime = (new Date(dateRange.to)).getTime();
            returnUrl += `startDate=${startTime}&endDate=${endTime}`;
        } else {
            returnUrl += `startBlock=${blockRange.startBlock}&endBlock=${blockRange.endBlock}`;
        }

        return returnUrl;
    }

    if (exportType === EXPORT_DOWNLOAD_TYPES.transactions) {
        let url = `/address/${accountAddress}/transactions`;
        url = appendFilters(url);
        let contracts: IndexerContractData[];
        let transactions: EvmTransaction[];

        try {
            const { data } = await indexerApi.get(url);
            const { results } = data as { results: EvmTransaction[] };

            contracts = data.contracts;
            transactions = results;
        } catch (e) {
            console.error(e);
            return;
        }

        const transactionRows = await Promise.all(
            transactions.map(async (transaction) => {
                let contract;
                let parsedTransaction;

                if (transaction.input !== '0x' && transaction.to) {
                    addEmptyContractToCache(
                        contractManager,
                        contracts,
                        transaction,
                    );

                    contract = await contractManager.getContract(
                        transaction.to,
                    );

                    if (contract) {
                        try {
                            parsedTransaction = await contractManager.parseContractTransaction(
                                transaction,
                                transaction.input,
                                contract,
                                true,
                            );
                        } catch (e) {
                            parsedTransaction = null;
                        }
                    }
                }

                let actionName = '';

                if (
                    !parsedTransaction
                    && transaction.from === ZERO_ADDRESSES
                    && Number(transaction.value) > 0
                    && Number(transaction.gasPrice) === 0
                ) {
                    actionName = $t('components.transaction.deposit');
                } else if (
                    !parsedTransaction
                    && transaction.to === ZERO_ADDRESSES
                    && Number(transaction.value) > 0
                    && Number(transaction.gasPrice) === 0
                ) {
                    actionName = $t('components.transaction.withdraw');
                } else if (
                    !parsedTransaction
                    && transaction.input === '0x'
                    && Number(transaction.value) > 0
                ) {
                    actionName = $t('components.transaction.tlos_transfer');
                } else if (!parsedTransaction && transaction.to === null) {
                    actionName = $t(
                        'components.transaction.contract_deployment',
                    );
                } else if (parsedTransaction) {
                    actionName = parsedTransaction.name;
                } else {
                    actionName = $t(
                        'components.transaction.contract_interaction',
                    );
                }

                return {
                    [$t(
                        'components.export.column_header_to',
                    )]: `"${transaction.from}"`,
                    [$t('components.export.column_header_from')]: `"${
                        transaction.to ?? ''
                    }"`,
                    [$t(
                        'components.export.column_header_contract_address',
                    )]: `"${transaction.contractAddress ?? ''}"`,
                    [$t(
                        'components.export.column_header_block_number',
                    )]: `"${String(transaction.blockNumber)}"`,
                    [$t(
                        'components.export.column_header_tx_hash',
                    )]: `"${transaction.hash}"`,
                    [$t(
                        'components.export.column_header_timestamp',
                    )]: `"${String(transaction.timestamp)}"`,
                    [$t(
                        'components.export.column_header_date',
                    )]: `"${formatTimestamp(transaction.timestamp)}"`,
                    [$t(
                        'components.export.column_header_action',
                    )]: `"${actionName}"`,
                };
            }),
        );

        // Add the header
        const headers = [
            $t('components.export.column_header_to'),
            $t('components.export.column_header_from'),
            $t('components.export.column_header_contract_address'),
            $t('components.export.column_header_block_number'),
            $t('components.export.column_header_tx_hash'),
            $t('components.export.column_header_timestamp'),
            $t('components.export.column_header_date'),
            $t('components.export.column_header_action'),
        ];
        csvContent += `${headers.map(header => `"${header}"`).join(',')}\r\n`;

        transactionRows.forEach((obj) => {
            const row = headers.map(header => escapeCSVValue((obj as Record<string, string>)[header]));
            csvContent += `${row.join(',')}\r\n`;
        });

        fileName = `teloscan-txs-${accountAddress}.csv`;
    } else if (exportType === EXPORT_DOWNLOAD_TYPES.erc20Transfers) {
        let url = `/account/${accountAddress}/transfers`;
        url = appendFilters(url, 'type=erc20');

        const { data } = await indexerApi.get(url);
        const { results } = data as { results: EvmTransfer[] };
        const transfers: EvmTransfer[] = results;

        const transferRows = await Promise.all(
            transfers.map(async (transfer) => {
                const contract = await contractManager.getContract(
                    transfer.contract,
                );
                const amount = formatWei(
                    transfer.amount,
                    contract.properties.decimals,
                );

                return {
                    [$t(
                        'components.export.column_header_to',
                    )]: `"${transfer.from}"`,
                    [$t(
                        'components.export.column_header_from',
                    )]: `"${transfer.to}"`,
                    [$t(
                        'components.export.column_header_block_number',
                    )]: `"${String(transfer.blockNumber)}"`,
                    [$t(
                        'components.export.column_header_tx_hash',
                    )]: `"${transfer.transaction}"`,
                    [$t(
                        'components.export.column_header_timestamp',
                    )]: `"${String(transfer.timestamp)}"`,
                    [$t(
                        'components.export.column_header_date',
                    )]: `"${formatTimestamp(transfer.timestamp)}"`,
                    [$t(
                        'components.export.column_header_amount',
                    )]: `"${amount}"`,
                    [$t(
                        'components.export.column_header_token_name',
                    )]: `"${contract.properties.name}"`,
                    [$t(
                        'components.export.column_header_token_symbol',
                    )]: `"${contract.properties.symbol}"`,
                    [$t(
                        'components.export.column_header_token_contract_address',
                    )]: `"${transfer.contract}"`,
                };
            }),
        );

        // Add the header
        const headers = [
            $t('components.export.column_header_to'),
            $t('components.export.column_header_from'),
            $t('components.export.column_header_block_number'),
            $t('components.export.column_header_tx_hash'),
            $t('components.export.column_header_timestamp'),
            $t('components.export.column_header_date'),
            $t('components.export.column_header_amount'),
            $t('components.export.column_header_token_name'),
            $t('components.export.column_header_token_symbol'),
            $t('components.export.column_header_token_contract_address'),
        ];
        csvContent += `${headers.map(header => `"${header}"`).join(',')}\r\n`;

        transferRows.forEach((obj) => {
            const row = headers.map(header => escapeCSVValue((obj as Record<string, string>)[header]));
            csvContent += `${row.join(',')}\r\n`;
        });

        fileName = `teloscan-erc20-transfers-${accountAddress}.csv`;
    } else {
        let url = `/account/${accountAddress}/transfers`;
        let type;

        if (exportType === EXPORT_DOWNLOAD_TYPES.erc721Transfers) {
            type = 'erc721';
            fileName = `teloscan-erc721-transfers-${accountAddress}.csv`;
        } else {
            type = 'erc1155';
            fileName = `teloscan-erc1155-transfers-${accountAddress}.csv`;
        }

        url = appendFilters(url, `type=${type}`);

        const { data } = await indexerApi.get(url);
        const { results } = data as { results: EvmTransfer[] };
        const transfers: EvmTransfer[] = results;

        const transferRows = await Promise.all(
            transfers.map(async (transfer) => {
                const contract = await contractManager.getContract(
                    transfer.contract,
                );
                const amount = exportType
                    === EXPORT_DOWNLOAD_TYPES.erc721Transfers
                    ? '1'
                    : transfer.amount;

                return {
                    [$t(
                        'components.export.column_header_to',
                    )]: `"${transfer.from}"`,
                    [$t(
                        'components.export.column_header_from',
                    )]: `"${transfer.to}"`,
                    [$t(
                        'components.export.column_header_block_number',
                    )]: `"${String(transfer.blockNumber)}"`,
                    [$t(
                        'components.export.column_header_tx_hash',
                    )]: `"${transfer.transaction}"`,
                    [$t(
                        'components.export.column_header_timestamp',
                    )]: `"${String(transfer.timestamp)}"`,
                    [$t(
                        'components.export.column_header_date',
                    )]: `"${formatTimestamp(transfer.timestamp)}"`,
                    [$t(
                        'components.export.column_header_amount',
                    )]: `"${amount}"`,
                    [$t(
                        'components.export.column_header_nft_collection_name',
                    )]: `"${contract.properties.name}"`,
                    [$t(
                        'components.export.column_header_nft_id',
                    )]: `"${transfer.id}"`,
                    [$t(
                        'components.export.column_header_token_contract_address',
                    )]: `"${transfer.contract}"`,
                };
            }),
        );

        // Add the header
        const headers = [
            $t('components.export.column_header_to'),
            $t('components.export.column_header_from'),
            $t('components.export.column_header_block_number'),
            $t('components.export.column_header_tx_hash'),
            $t('components.export.column_header_timestamp'),
            $t('components.export.column_header_date'),
            $t('components.export.column_header_amount'),
            $t('components.export.column_header_nft_collection_name'),
            $t('components.export.column_header_nft_id'),
            $t('components.export.column_header_token_contract_address'),
        ];
        csvContent += `${headers.map(header => `"${header}"`).join(',')}\r\n`;

        transferRows.forEach((obj) => {
            const row = headers.map(header => escapeCSVValue((obj as Record<string, string>)[header]));
            csvContent += `${row.join(',')}\r\n`;
        });
    }

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create a Download Link
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', fileName);

    // Trigger the Download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
