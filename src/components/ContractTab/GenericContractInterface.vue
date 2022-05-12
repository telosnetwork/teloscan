<template>
  <div class="q-pa-md">
    <div class="row q-pb-md">
      <div class="col-12">
        <p>
          <q-icon
            name="warning"
            class="text-red"
            size="1.25rem"
          />
          This contract source has not been verified.
        </p>
        <p>
          Click <router-link :to="{ name: 'sourcify' }">
            here
          </router-link>
          to upload source files and verify this contract.
          Alternatively, you can interact with the contract using an arbitrary ABI:
        </p>
      </div>
    </div>

    <div class="row q-pb-lg">
      <div class="col-12">
        <q-btn-group push>
          <q-btn
            push
            no-caps
            :outline="selectedAbi === abiOptions.erc20"
            @click="selectedAbi = abiOptions.erc20"
          >
            Use ERC20 ABI
          </q-btn>
          <q-btn
            push
            no-caps
            :outline="selectedAbi === abiOptions.erc721"
            @click="selectedAbi = abiOptions.erc721"
          >
            Use ERC721 ABI
          </q-btn>
          <q-btn
            push
            no-caps
            :outline="selectedAbi === abiOptions.custom"
            @click="selectedAbi = abiOptions.custom"
          >
            ABI from JSON
          </q-btn>
        </q-btn-group>
      </div>
    </div>

    <div
      v-if="selectedAbi === abiOptions.custom"
      class="row q-mb-xl"
    >
      <div class="col-sm-12 col-md-10 col-lg-8 col-xl-6">
        <q-input
          v-model="customAbiDefinition"
          clearable
          name="custom-abi"
          label="Paste ABI JSON here"
          class="q-pb-lg"
        />

        <template v-if="!!customAbiDefinition">
          <template v-if="customAbiIsValidJSON">
            <p class="q-mb-sm">
              ABI JSON Preview
            </p>
            <JsonViewer
              :value="JSON.parse(customAbiDefinition)"
              :expand-depth="1"
              expanded
              theme="custom-theme"
            />
            <p
              v-if="!showAbiFunctions"
              class="text-red"
            >
              Provided ABI is either invalid or contains no function definitions
            </p>
          </template>
          <p
            v-else
            class="text-red"
          >
            Provided JSON is invalid
          </p>
        </template>
      </div>
    </div>

    <div
      v-if="showAbiFunctions"
      class="row"
    >
      <div class="col-12">
        <q-btn-group>
          <q-btn
            no-caps
            :outline="displayWriteFunctions === false"
            @click="displayWriteFunctions = false"
          >
            Read functions
          </q-btn>
          <q-btn
            no-caps
            :outline="displayWriteFunctions === true"
            @click="displayWriteFunctions = true"
          >
            Write functions
          </q-btn>
        </q-btn-group>

        <q-list
          v-if="displayWriteFunctions"
          class="interface-list"
        >
          <q-expansion-item
            v-for="func in functions.write"
            :key="func.name"
            :label="func.name"
            class="interface-item"
          >
            <FunctionInterface
              :abi="func"
              :contract="contract"
              :write="true"
              group="write"
              run-label="Write"
              class="interface-input"
            />
          </q-expansion-item>
        </q-list>
        <q-list
          v-else
          class="interface-list"
        >
          <q-expansion-item
            v-for="func in functions.read"
            :key="func.name"
            :label="func.name"
            class="interface-item"
          >
            <FunctionInterface
              :abi="func"
              :contract="contract"
              :write="false"
              group="read"
              run-label="Query"
              class="interface-input"
            />
          </q-expansion-item>
        </q-list>
      </div>
    </div>
  </div>
</template>

<script>
import JsonViewer from 'vue-json-viewer';

import Contract from 'src/lib/Contract';
import erc721Abi from 'src/lib/erc721';
import erc20Abi from "erc-20-abi";

import { sortAbiFunctionsByName } from "src/lib/utils";

import FunctionInterface from 'components/ContractTab/FunctionInterface.vue';

export default {
    name: 'GenericContractInterface',
    components: {
        FunctionInterface,
        JsonViewer,
    },
    data: () => ({
        address: null,
        contract: null,
        functions: null,
        displayWriteFunctions: false,
        customAbiDefinition: "",
        selectedAbi: null,
        abiOptions: {
            erc20: 'erc20',
            erc721: 'erc721',
            custom: 'custom',
        },
    }),
    computed: {
        showAbiFunctions() {
            return Object.values(this.abiOptions).includes(this.selectedAbi) &&
                ['read', 'write']
                    .some(access => (this.functions?.[access] ?? [])
                    .some(member => member.type === 'function'))
        },
        customAbiIsValidJSON() {
            try {
                return !!JSON.parse(this.customAbiDefinition);
            } catch {
                return false;
            }
        },
    },
    watch: {
        selectedAbi(oldValue, newValue) {
            if (oldValue !== newValue) {
                this.formatAbiFunctionLists();
                this.displayWriteFunctions = false;
            }
        },
        customAbiDefinition(oldValue, newValue) {
            if (oldValue !== newValue && this.customAbiIsValidJSON) {
                this.formatAbiFunctionLists();
                this.displayWriteFunctions = false;
            }
        }
    },
    created() {
        this.address = this.$route.params.address;
    },
    methods: {
        async formatAbiFunctionLists() {
            this.functions = {
                read: [],
                write: []
            };

            const { custom, erc20, erc721 } = this.abiOptions;

            let abi;
            const customAbiSelected = this.selectedAbi === custom;

            const selectedAbiIsCustomAndValid =
                !!this.customAbiDefinition &&
                this.customAbiIsValidJSON &&
                customAbiSelected;

            if (selectedAbiIsCustomAndValid) {
                abi = JSON.parse(this.customAbiDefinition);
            } else if (this.selectedAbi === erc20) {
                abi = erc20Abi;
            } else if (this.selectedAbi === erc721) {
                abi = erc721Abi;
            } else {
                return;
            }

            this.contract = new Contract({
                name: 'Unverified contract',
                address: this.address,
                abi,
                manager: this.$contractManager,
            });

            let read = [];
            let write = [];

            (this.contract?.abi ?? []).forEach(a => {
                if (a.type !== 'function') return;

                if (a.stateMutability === 'view') {
                    read.push(a);
                } else {
                    write.push(a);
                }
            });

            this.functions = {
                read: sortAbiFunctionsByName(read),
                write: sortAbiFunctionsByName(write)
            };
        },
    }
}
</script>
