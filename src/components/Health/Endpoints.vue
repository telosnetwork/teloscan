<script>
import axios from 'axios';
import axiosTime from 'axios-time';

const ENDPOINT_LIST = 'https://raw.githubusercontent.com/telosnetwork/evm-rpc-list/main/list.json';
const TIMEOUT_MS = 2000;

export default {
    name: 'EndpointsPage',
    data() {
        return {
            endpoints: [],
            blockHeight: 0,
        };
    },
    mounted() {
        this.checkEndpoints();
    },
    methods: {
        getLatencyColor(latency) {
            if (latency < 375) {
                return 'green';
            }

            if (latency < 650) {
                return 'yellow';
            }

            return 'red';
        },
        getBlockClass(currentHeight, block) {
            if (currentHeight === 0) {
                return 'text-green';
            }

            const diff = (currentHeight - block);

            if (diff > 50) {
                return 'text-red';
            }

            if (diff > 20) {
                return 'text-yellow';
            }

            return 'text-green';
        },
        async checkEndpoints() {
            await this.loadEndpoints();
            this.endpoints.forEach((endpoint, idx) => {
                this.doCheck(endpoint, idx);
            });
        },
        async loadEndpoints() {
            const results = await axios.get(ENDPOINT_LIST);
            this.endpoints = results.data;
        },
        async doCheck(endpoint, idx) {
            try {
                const checker = axios.create({
                    timeout: TIMEOUT_MS,
                });

                axiosTime(checker);
                const result = await checker.post(endpoint.http, {
                    'jsonrpc': '2.0',
                    'method': 'eth_blockNumber',
                    'params': [],
                    'id': 1,
                });

                const block = parseInt(result.data.result, 16);
                if (this.blockHeight < block) {
                    this.blockHeight = block;
                }

                this.endpoints[idx].latency = result.timings.elapsedTime;
                this.endpoints[idx].block = block;
            } catch (e) {
                this.endpoints[idx].error = e.message;
            }
        },
    },
};
</script>

<template>
<div class="q-mb-md tableWrapper">
    <q-card>
        <q-item v-for="endpoint in endpoints" :key="endpoint.endpoint">
            <q-item-section class="full-width">
                <q-item-label class="text-weight-medium">
                    {{ endpoint.name }}
                </q-item-label>
                <q-item-label v-if="endpoint.description" caption="caption">
                    {{ endpoint.description }}
                </q-item-label>
            </q-item-section>
            <q-item-section class="full-width">
                <q-item-label class="q-mt-sm">
                    {{ endpoint.http }}
                </q-item-label>
            </q-item-section>
            <q-item-section class="full-width">
                <q-item-label v-if="endpoint.latency" side top>
                    {{ $t('components.health.latency') }}: {{ endpoint.latency }}ms
                    <q-icon name="wifi" :color="getLatencyColor(endpoint.latency)"/>
                </q-item-label>
                <q-item-label v-if="endpoint.block" side top>
                    {{ $t('components.health.block_height') }}:&nbsp;
                    <span :class="getBlockClass(blockHeight, endpoint.block)">
                        {{ endpoint.block }}
                    </span>
                </q-item-label>
                <q-item-label
                    v-if="endpoint.error"
                    class="text-red"
                    side
                    top
                >
                    Error: {{ endpoint.error }}
                </q-item-label>
            </q-item-section>
        </q-item>
    </q-card>
</div>
</template>

<style scoped lang='sass'>
.q-list
  border-radius: 6px
  box-shadow: 0 1px 5px rgb(0 0 0 / 20%), 0 2px 2px rgb(0 0 0 / 14%), 0 3px 1px -2px rgb(0 0 0 / 12%)
.tableWrapper
  min-width: 50vw
  max-width: 100vw
  border-radius: 6px
.text-primary
  margin-left: .25rem
@media only screen and (max-width: 600px)
  .full-width
    min-width: 100%
    margin-top: .25rem
  .no-wrap
    flex-wrap: wrap
</style>
