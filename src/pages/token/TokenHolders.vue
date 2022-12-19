<template>
<div class="container c-token-holders">
    <q-dialog v-model="showChart" class="c-token-holders__chart-modal">
        <q-card class="c-token-holders__chart-container">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">Top 50 Holders of {{ tokenInfo.symbol }}</div>
                <q-space />
                <q-btn
                    icon="close"
                    flat
                    round
                    dense
                    v-close-popup
                />
            </q-card-section>

            <q-card-section>
                <!-- Highcharts target -->
                <div id="token-holders-chart"></div>
            </q-card-section>
        </q-card>
    </q-dialog>

    <div class="row">
        <div class="col">
            <q-btn
                :disable="!enableShowChartButton"
                color="secondary"
                no-caps
                @click="() => setChartVisibility(true)"
            >
                Show Holders Graph
            </q-btn>
        </div>
    </div>
    <div class="row">
        <div class="col-12">
            <q-table
                v-model:pagination="pagination"
                :rows="holders"
                :columns="columns"
                :loading="loading"
                flat
            >
                <template v-slot:header>
                    <q-tr>
                        <q-th
                            v-for="col in columns"
                            :key="col.label"
                            class="text-left"
                        >
                            {{ col.label }}
                        </q-th>
                    </q-tr>
                </template>

                <template v-slot:body="props">
                    <q-tr :props="props">
                        <q-td key="rank" :props="props">
                            {{ props.row.rank }}
                        </q-td>
                        <q-td key="address" :props="props">
                            <router-link :to="`/address/${props.row.holder.address}`">
                                <address-field
                                    :address="props.row.holder.address"
                                    :is-contract="props.row.holder.isContract"
                                    :truncate="-1"
                                />
                            </router-link>
                        </q-td>
                        <q-td key="balance" :props="props">
                            {{ formatBalance(props.row.balance) }}
                        </q-td>
                    </q-tr>
                </template>
            </q-table>
        </div>
    </div>
</div>
</template>

<script>
import { keys } from 'lodash';
import Highcharts from 'highcharts';
import bigDecimal from 'js-big-decimal';

import AddressField from 'components/AddressField';

import { formatWei } from 'src/lib/utils';

const columns = [{
    name: 'rank',
    label: 'Rank',
    align: 'left',
},{
    name: 'address',
    label: 'Address',
    align: 'left',
},{
    name: 'balance',
    label: 'Balance',
    align: 'left',
}];

export default {
    name: 'TokenHolders',
    emits: ['token-info-loaded'],
    components: {
        AddressField,
    },
    props: {
        address: {
            type: String,
            required: true,
        },
    },
    data: () => ({
        columns,
        pagination: {
            page: 1,
            rowsPerPage: 50,
        },
        holders: [],
        loading: true,
        tokenInfo: null,
        showChart: false,
    }),
    computed: {
        enableShowChartButton() {
            return Boolean(this.holders?.length) && this.tokenInfo !== null;
        },
        chartData() {
            if (!this.enableShowChartButton) {
                return [];
            }

            const topHundredHolders = this.holders.slice(0, 100);

            const topHoldersTotalBigDecimal = topHundredHolders.reduce(
                (acc, holder) => bigDecimal.add(acc, holder.balance),
                0,
            );
            const everyoneElseTotalBigDecimal = bigDecimal.subtract(this.tokenInfo.supply, topHoldersTotalBigDecimal);

            const getHolderPercentage = (held) => {
                const divided = bigDecimal.divide(held, this.tokenInfo.supply);
                const percent = bigDecimal.multiply(100, divided);

                return +percent;
            };

            const shapedHolders = topHundredHolders
                .map(holder => ({
                    name: `${holder.holder.address}`,
                    y: getHolderPercentage(holder.balance),
                }))
                .concat({
                    name: 'Other Accounts',
                    y: getHolderPercentage(everyoneElseTotalBigDecimal),
                });

            return [...shapedHolders];
        },
    },
    created() {
        const emitTokenInfo = info => this.$emit('token-info-loaded', info)

        const params = {
            limit: 1000,
            offset: null,
        };

        this.$teloscanApi.get(`token/${this.address}/holders`, { params })
            .then(({ data }) => {
                const rows = data?.results ?? [];

                const tokenContractMeta = data?.contracts[this.address] ?? {};
                const contractAddresses = keys(data?.contracts);

                const shapedRows = rows.map(({ balance, address }, index) => ({
                    rank: index + 1,
                    balance,
                    holder: {
                        address,
                        isContract: contractAddresses.includes(address),
                    },
                }));

                emitTokenInfo(tokenContractMeta);
                this.tokenInfo = tokenContractMeta;
                this.holders = [...shapedRows];
            })
            .catch((err) => {
                emitTokenInfo({});
                this.holders = [];
                this.tokenInfo = null;
                console.error(`Unable to fetch token holders for address ${this.address}:\n${err}`);
            })
            .finally(() => {
                this.loading = false
            });
    },
    methods: {
        formatBalance(balance) {
            return formatWei(balance, this.tokenInfo.decimals, 6)
        },
        setChartVisibility(visibility) {
            if (visibility === true) {
                this.showChart = true;

                // timeout is a workaround; without it, text in the chart is the wrong size due to q-dialog
                // transition styling
                setTimeout(async () => {
                    await this.$nextTick();
                    Highcharts.chart('token-holders-chart', {
                        credits: false,
                        chart: {
                            plotBorderWidth: null,
                            plotShadow: false,
                            type: 'pie',
                        },
                        title: {
                            text: null,
                        },
                        tooltip: {
                            pointFormat: '{series.name}: {point.percentage:.1f}%',
                        },
                        accessibility: {
                            point: {
                                valueSuffix: '%',
                            },
                        },
                        plotOptions: {
                            pie: {
                                allowPointSelect: false,
                                cursor: 'pointer',
                                dataLabels: {
                                    enabled: true,
                                    format: '{point.name}',
                                },
                            },
                        },
                        series: [{
                            name: 'Holders',
                            colorByPoint: true,
                            data: [...this.chartData],
                        }],
                    });
                }, 500);
            }
        },
    },
}
</script>

<style lang="scss">
.c-token-holders {
    &__chart-container {
        width: 80vw;
        height: max-content;
        min-height: 50vh;
        max-width: unset !important;
        max-height: unset !important;

        @media screen and (min-width: $breakpoint-md-min) {
            width: 65vw;
        }
    }

    &__chart-modal {
        @at-root .body--dark & {
            .highcharts-background {
                fill: $dark;
            }

            .highcharts-title {
                color: white !important;
                fill: white !important;
            }

            .highcharts-text-outline {
                fill: transparent;
                stroke: transparent;
            }

            .highcharts-data-label text {
                color: white !important;
                fill: white !important;
            }
        }

        // eztodo verify if these are necessary - from highcharts example
        // highcharts overrides
        //.highcharts-figure,
        //.highcharts-data-table table {
        //    min-width: 320px;
        //    max-width: 800px;
        //    margin: 1em auto;
        //}
        //
        //.highcharts-data-table table {
        //    font-family: Verdana, sans-serif;
        //    border-collapse: collapse;
        //    border: 1px solid #ebebeb;
        //    margin: 10px auto;
        //    text-align: center;
        //    width: 100%;
        //    max-width: 500px;
        //}
        //
        //.highcharts-data-table caption {
        //    padding: 1em 0;
        //    font-size: 1.2em;
        //    color: #555;
        //}
        //
        //.highcharts-data-table th {
        //    font-weight: 600;
        //    padding: 0.5em;
        //}
        //
        //.highcharts-data-table td,
        //.highcharts-data-table th,
        //.highcharts-data-table caption {
        //    padding: 0.5em;
        //}
        //
        //.highcharts-data-table thead tr,
        //.highcharts-data-table tr:nth-child(even) {
        //    background: #f8f8f8;
        //}
        //
        //.highcharts-data-table tr:hover {
        //    background: #f1f7ff;
        //}
        //
        //input[type="number"] {
        //    min-width: 50px;
        //}
    }
}
</style>
