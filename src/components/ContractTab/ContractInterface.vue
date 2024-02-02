<script>
import FunctionInterface from 'components/ContractTab/FunctionInterface';

import { sortAbiFunctionsByName } from 'src/lib/utils';
import { toChecksumAddress } from 'src/lib/utils';


export default {
    name: 'ContractInterface',
    components: { FunctionInterface },
    props: {
        write: {
            type: Boolean,
            required: true,
        },
        proxy: {
            type: String,
            default: '',
        },
    },
    data: () => ({
        functions: {
            read: [],
            write: [],
        },
        contract: {},
        isProxyForUnverifiedContract: false,
        loading: true,
    }),
    computed: {
        showNoAvailableMethods() {
            return !this.isProxyForUnverifiedContract && ((this.write && !this.functions.write.length) || (!this.write && !this.functions.read.length));
        },
        formattedProxyAddress() {
            return this.proxy ? toChecksumAddress(this.proxy) : '';
        },
    },
    async mounted() {
        // eztodo add label saying it is a proxy if it is
        this.populateFunctions();
    },
    watch: {
        proxy() {
            this.populateFunctions();
        },
        write() {
            this.populateFunctions();
        },
    },
    methods: {
        async populateFunctions() {
            this.loading = true;
            this.isProxyForUnverifiedContract = false;

            const contractAddress = this.proxy || this.$route.params.address;

            this.contract = await this.$contractManager.getContract(contractAddress);

            if (this.proxy && !this.contract.abi) {
                this.isProxyForUnverifiedContract = true;
                this.functions = {
                    read: [],
                    write: [],
                };
                this.loading = false;
                return;
            }

            let read = [];
            let write = [];
            this.contract.abi.forEach((a) => {
                if (a.type !== 'function') {
                    return;
                }

                if (a.stateMutability === 'view') {
                    read.push(a);
                } else {
                    write.push(a);
                }
            });

            this.functions = {
                read: sortAbiFunctionsByName(read),
                write: sortAbiFunctionsByName(write),
            };
            this.loading = false;
        },
    },
};
</script>

<template>
<div class="q-pa-md">
    <div v-if="loading" class="text-center">
        <q-spinner
            size="md"
            class="q-ma-xl"
        />
    </div>

    <template v-else>
        <!-- eztodo i18n -->
        <p v-if="proxy" class="q-mt-md">
            This contract is an EIP-1967 Transparent Proxy for the contract
            <router-link :to="{ name: 'address', params: { address: formattedProxyAddress } }">
                {{ formattedProxyAddress }}
            </router-link>.
        </p>

        <!-- eztodo i18n -->
        <template v-if="isProxyForUnverifiedContract">
            <p class="q-mt-md">
                The contract for which this is a proxy is not verified, so its ABI is not available. To interact with the implementation contract,
                visit the
                <router-link :to="{ name: 'address', params: { address: formattedProxyAddress }, hash: '#contract' }">
                    implementation contract page
                </router-link>
            </p>
        </template>

        <!-- eztodo i18n -->
        <p v-if="showNoAvailableMethods" class="q-mt-md">
            There are no available Contract ABI methods to read
        </p>

        <q-list v-if="(write && functions.write.length) || (!write && functions.read.length)">
            <q-expansion-item
                v-for="func in (write ? functions.write : functions.read)"
                :key="func.name"
                :label="func.name"
                class="shadow-2 q-mb-md"
            >
                <q-card>
                    <div class="q-pa-md">
                        <FunctionInterface
                            :abi="func"
                            :contract="contract"
                            :group="write ? 'write' : 'read'"
                            :run-label="write ? 'Write' : 'Query'"
                        />
                    </div>
                </q-card>
            </q-expansion-item>
        </q-list>
    </template>
</div>
</template>
