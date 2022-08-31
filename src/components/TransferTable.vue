<script>
import AddressField from 'components/AddressField';
import DateField from 'components/DateField';
import TransactionField from 'components/TransactionField';
import {ethers, BigNumber} from 'ethers';
import DEFAULT_TOKEN_LOGO from 'src/assets/evm_logo.png';

const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// TODO: Add icon column and render it
const columns = [
    {
        name: 'hash',
        label: 'TX Hash',
        align: 'left',
    },
    {
        name: 'date',
        label: 'Date',
        align: 'left',
    },
    {
        name: 'from',
        label: 'From',
        align: 'left',
    },
    {
        name: 'to',
        label: 'To',
        align: 'left',
    },
    {
        name: 'value',
        label: 'Value',
        align: 'left',
    },{
        name: 'token',
        label: 'Token',
        align: 'left',
    },
];

export default {
    name: 'TransferTable',
    components: {
        TransactionField,
        DateField,
        AddressField,
    },
    props: {
        title: {
            type: String,
            required: true,
        },
        tokenType: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        initialPageSize: {
            type: Number,
            required: true,
        },
    },
    data() {
        return {
            rows: [],
            columns,
            transfers: [],
            pageSize: this.initialPageSize,
            total: null,
            loading: false,
            expectedTopicLength: 0,
            pagination: {
                sortBy: 'date',
                descending: true,
                page: 1,
                rowsPerPage: 10,
                rowsNumber: 0,
            },
            showAge: true,
            tokenList: {},
        };
    },
    mounted() {
        switch (this.tokenType) {
        case 'erc20':
            this.expectedTopicLength = 3;
            break;
        case 'erc721':
            this.expectedTopicLength = 4;
            break;
        default:
            throw new Error(`Unsupported token type: ${this.tokenType}`);
        }

        this.onRequest({
            pagination: this.pagination,
        });
    },
    methods: {
        async onRequest(props) {
            this.loading = true;

            const { page, rowsPerPage, sortBy, descending } = props.pagination;

            let result = await this.$evmEndpoint.get(this.getPath(props));
            if (this.total == null)
                this.pagination.rowsNumber = result.data.total.value;

            this.pagination.page = page;
            this.pagination.rowsPerPage = rowsPerPage;
            this.pagination.sortBy = sortBy;
            this.pagination.descending = descending;

            let newTransfers = [];
            for (const transaction of result.data.transactions) {
                try {
                    for (const log of transaction.logs) {
                        if (this.expectedTopicLength !== log.topics.length)
                            continue;

                        if (log.topics[0].toLowerCase() !== TRANSFER_EVENT_SIGNATURE.toLocaleLowerCase())
                            continue;

                        const address = `0x${log.address.substring(log.address.length - 40)}`;
                        const from = `0x${log.topics[1].substring(log.topics[1].length - 40)}`;
                        const to = `0x${log.topics[2].substring(log.topics[2].length - 40)}`;
                        if (to.toLowerCase() !== this.address.toLowerCase() && from.toLowerCase() !== this.address.toLowerCase())
                            continue;

                        const contract = await this.$contractManager.getContract(
                            ethers.utils.getAddress(address),
                            this.tokenType,
                        );

                        const token = contract.token;
                        let valueDisplay;
                        if (this.tokenType === 'erc20') {
                            const valueBn = BigNumber.from(log.data);
                            if (token && typeof token.decimals === 'number') {
                                let valueStr = ethers.utils.formatUnits(valueBn, token.decimals)
                                let decimalIndex = valueStr.indexOf('.');
                                if (decimalIndex >= 0) {
                                    // TODO: what if the value is .0000000000234 then it becomes .000000??
                                    valueStr = valueStr.substring(0, decimalIndex + 6);
                                }

                                if (valueStr.length > 50)
                                    valueStr = `${valueStr.slice(0, 20)} ...`

                                valueDisplay = valueStr + ' ' + token.symbol
                            } else {
                                valueDisplay = 'Unknown precision';
                            }
                        } else {
                            valueDisplay = `Id #${parseInt(log.topics[3], 16)}`
                        }

                        const transfer = {
                            hash: transaction.hash,
                            epoch: transaction.epoch,
                            valueDisplay, address, from, to, ...contract,
                        };

                        newTransfers.push(transfer);
                    }

                } catch (e) {
                    console.error(
                        `Failed to parse data for transaction, error was: ${e.message}`,
                    );
                }
            }

            this.transfers.splice(
                0,
                this.transfers.length,
                ...newTransfers,
            );

            this.setRows(page, rowsPerPage);
            this.loading = false;
        },
        setRows() {
            // TODO: do this differently?
            this.rows = this.transfers;
        },
        getIcon(row) {
            if (row.token && row.token.logoURI) {
                if (row.token.logoURI.startsWith('ipfs://')) {
                    return `https://ipfs.io/ipfs/${row.token.logoURI.replace(/ipfs:\/\//, '')}`
                }
                return row.token.logoURI;
            } else {
                return DEFAULT_TOKEN_LOGO;
            }
        },
        getPath(props) {
            const { page, rowsPerPage, descending } = props.pagination;
            let path = `/v2/evm/get_transactions?limit=${
                rowsPerPage === 0 ? 500 : rowsPerPage
            }`;

            path += `&log_topics=${TRANSFER_EVENT_SIGNATURE},${this.address}`
            path += `&skip=${(page - 1) * rowsPerPage}`;
            path += `&sort=${descending ? 'desc' : 'asc'}`;

            return path;
        },
    },
};
</script>
<template lang="pug">
q-table(
    :rows="rows"
    :row-key='row => row.hash'
    :columns="columns"
    v-model:pagination="pagination"
    :loading="loading"
    @request="onRequest"
    :rows-per-page-options="[10, 20, 50]"
    flat
)
    q-tr( slot="header" slot-scope="props", :props="props" )
      q-th(
        v-for="col in props.cols"
        :key="col.name"
        :props="props"
        @click="col.name==='date' ? showAge=!showAge : null"
      )
        template(
          v-if="col.name==='date'"
          class=""
        )
          q-tooltip(anchor="bottom middle" self="bottom middle") Click to change format
        | {{ col.label }}
        template(
          v-if="col.name==='method'"
        )
          q-icon(name="fas fa-info-circle")
            q-tooltip(anchor="bottom middle" self="top middle" max-width="10rem") Function executed based on decoded input data. For unidentified function, method ID is displayed instead.


    q-tr( slot="body" slot-scope="props" :props="props" )
      q-td( key="hash" )
        transaction-field( :transaction-hash="props.row.hash" )
      q-td( key="date" )
        date-field( :epoch="props.row.epoch", :showAge="showAge" )
      q-td( key="from" )
        address-field( :address="props.row.from" )
      q-td( key="to" )
        address-field( :address="props.row.to" )
      q-td( key="value" ) {{ props.row.valueDisplay }}
      q-td( key="token" )
        q-img.coin-icon( :src="getIcon(props.row)" )
        address-field.token-name( :address="props.row.address" :name="props.row.name" )
</template>

<style lang='sass' scoped>
.coin-icon
  width: 20px
  margin-right: .25rem

.token-name
  display: inline-block
</style>
