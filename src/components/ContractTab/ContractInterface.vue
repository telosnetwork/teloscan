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
        // for EIP-1967 proxies
        implementationContractAddress: {
            type: String,
            default: '',
        },
    },
    // emitted when a fn on the contract is run; for proxy contracts, this is used to check if the implementation contract has changed
    emits: ['functionRun'],
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
            return this.implementationContractAddress ? toChecksumAddress(this.implementationContractAddress) : '';
        },
    },
    async mounted() {
        this.populateFunctions();
    },
    watch: {
        implementationContractAddress() {
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

            let abi;

            this.contract = await this.$contractManager.getContract(this.$route.params.address);

            if (this.implementationContractAddress) {
                abi = (await this.$contractManager.getContract(this.implementationContractAddress)).abi;
            } else {
                abi = this.contract.abi;
            }

            if (this.implementationContractAddress && !abi) {
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
            abi.forEach((a) => {
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
        <p v-if="implementationContractAddress" class="q-mt-md">
            {{ $t('components.contract_tab.contract_is_proxy') }}
            <router-link :to="{ name: 'address', params: { address: formattedProxyAddress } }">
                {{ formattedProxyAddress }}
            </router-link>
        </p>

        <template v-if="isProxyForUnverifiedContract">
            <p class="q-mt-md">
                {{ $t('components.contract_tab.proxy_for_unverified_contract_part_1') }}

                <router-link :to="{ name: 'address', params: { address: formattedProxyAddress }, hash: '#contract' }">
                    {{ $t('components.contract_tab.proxy_for_unverified_contract_part_2') }}
                </router-link>
            </p>
        </template>

        <p v-if="showNoAvailableMethods" class="q-mt-md">
            {{ $t('components.contract_tab.no_abi_methods') }}
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
                            :run-label="write ? $t('components.contract_tab.write') : $t('components.contract_tab.query')"
                            :implementation-contract-address="implementationContractAddress"
                            @function-run="$emit('functionRun')"
                        />
                    </div>
                </q-card>
            </q-expansion-item>
        </q-list>
    </template>
</div>
</template>
