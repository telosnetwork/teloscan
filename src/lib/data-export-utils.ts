import { AxiosError } from 'axios';
import { exportApi } from 'src/boot/telosApi';
import { EXPORT_DOWNLOAD_TYPES } from 'src/lib/constants';

/**
 * Download a CSV file of transactions
 *
 * @param captcha The captcha token obtained from the captcha service
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
    captcha: string,
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
        let returnUrl = `${url}&limit=${limit}${extras ? `&${extras}` : ''}`;
        if (dateRange.from && dateRange.to) {
            const startTimestamp = (new Date(dateRange.from)).getTime();
            const endTimestamp = (new Date(dateRange.to)).getTime();
            returnUrl += `&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}`;
        } else {
            returnUrl += `&startBlock=${blockRange.startBlock}&endBlock=${blockRange.endBlock}`;
        }

        return returnUrl;
    }

    let url = `/export/${accountAddress}`;

    if (exportType === EXPORT_DOWNLOAD_TYPES.transactions) {
        url += `/transactions/csv?captcha=${captcha}`;
        url = appendFilters(url);
        fileName = `teloscan-txs-${accountAddress}.csv`;
    } else {
        url += `/transfers?captcha=${captcha}`;

        let type;

        switch (exportType) {
        case EXPORT_DOWNLOAD_TYPES.erc20Transfers:
            type = 'erc20';
            fileName = `teloscan-erc20-transfers-${accountAddress}.csv`;
            break;
        case EXPORT_DOWNLOAD_TYPES.erc721Transfers:
            type = 'erc721';
            fileName = `teloscan-erc721-transfers-${accountAddress}.csv`;
            break;
        case EXPORT_DOWNLOAD_TYPES.erc1155Transfers:
            type = 'erc1155';
            fileName = `teloscan-erc1155-transfers-${accountAddress}.csv`;
            break;
        default:
            type = 'erc20';
            fileName = `teloscan-erc20-transfers-${accountAddress}.csv`;
            break;
        }

        url = appendFilters(url, `types=${type}`);
        fileName = `teloscan-erc20-transfers-${accountAddress}.csv`;
    }

    try {
        const { data } = await exportApi.get(url);
        csvContent = data;
    } catch (e) {
        if (e instanceof AxiosError) {
            console.error(e.response?.data);
            return Promise.reject(e.response?.data);
        } else {
            console.error(e);
            return Promise.reject(e);
        }
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
