<template>
  <div class="c-generic-token-interface row q-pa-md">
    <div class="col-12">
      <p>
        <q-icon
          name="warning"
          class="text-red"
          size="1.25rem"
        />&nbsp;This contract source has not been verified.
      </p>
      Click
      <router-link :to="{name: 'sourcify'}">
        here
      </router-link>
      to upload source files and verify this contract.
      <br>
    </div>

    <div class="col-12">
      <button @click="selectedAbi = abiOptions.erc20">
        Use ERC20 ABI
      </button>
      <button @click="selectedAbi = abiOptions.erc721">
        Use ERC721 ABI
      </button>
      <button @click="selectedAbi = abiOptions.custom">
        Paste ABI
      </button>
    </div>

    <div v-if="selectedAbi === abiOptions.custom">
      <input
        v-model="customAbiDefinition"
        name="custom-abi"
        cols="30"
        rows="10"
        placeholder="Paste ABI JSON here"
      >
      <template v-if="customAbiDefinition">
        <JsonViewer
          v-if="customAbiIsValid"
          :value="JSON.parse(customAbiDefinition)"
          :expand-depth="2"
          expanded
          theme="custom-theme"
        />
        <p v-else>
          invalid ABI JSON
        </p>
        <!-- add error msg for invalid abi json -->
      </template>
    </div>

    <div
      v-if="showFunctions"
      class="col-12"
    >
      <button @click="write = !write">
        Read
      </button>
      <button @click="write = !write">
        Write
      </button>
      <q-list
        v-if="write"
        class="interface-list"
      >
        <q-expansion-item
          v-for="func in functions.write"
          :key="func.name"
          class="interface-item"
          :label="func.name"
        >
          <FunctionInterface
            class="interface-input"
            :abi="func"
            :contract="contract"
            group="write"
            run-label="Write"
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
          class="interface-item"
          :label="func.name"
        >
          <FunctionInterface
            class="interface-input"
            :abi="func"
            :contract="contract"
            group="read"
            run-label="Query"
          />
        </q-expansion-item>
      </q-list>
    </div>
  </div>
</template>

<script>
import JsonViewer from 'vue-json-viewer';

import Contract from 'src/lib/Contract';
import erc721Abi from 'src/lib/erc721';
import erc20Abi from "erc-20-abi";

import FunctionInterface from 'components/ContractTab/ContractInterface.vue';

export default {
    name: 'GenerictTokenInterface', // eztodo is this a good name?
    components: {
        FunctionInterface,
        JsonViewer,
    },
    data: () => ({
        address: null,
        contract: null,
        functions: null,
        write: false,
        selectedAbi: null,
        customAbiDefinition: "",
        abiOptions: {
            erc20: 'erc20',
            erc721: 'erc721',
            custom: 'custom',
        },
    }),
    computed: {
        showFunctions() {
            return Object.values(this.abiOptions).includes(this.selectedAbi) &&
                ['read', 'write']
                    .some(access => (this.functions?.[access] ?? [])
                    .some(member => typeof member === 'function'))
        },
        customAbiIsValid() {
            // eztodo should there be more here? or change to customAbiJSON or something
            try {
                JSON.parse(this.customAbiDefinition);
                return true;
            } catch {
                return false;
            }
        },
    },
    created() {
        this.address = this.$route.params.address;
    },
    async mounted() {
        await this.getAbiFunctions();
    },
    methods: {
        async getAbiFunctions() {
            const { custom, erc20, erc721 } = this.abiOptions;

            let abi;
            const customAbiSelected = this.selectedAbi === custom;

            const selectedAbiIsCustomAndValid = customAbiSelected &&
            this.customAbiDefinition &&
            this.customAbiIsValid;

            if (selectedAbiIsCustomAndValid) {
                abi = this.customAbiDefinition;
            } else if (this.selectedAbi === erc20) {
                abi = erc20Abi;
            } else if (this.selectedAbi === erc721) {
                abi = erc721Abi;
            }

            this.contract = new Contract({
                name: 'Unverified contract',
                address: this.address,
                // creationInfo, // what is this?
                abi,
                manager: this.$contractManager,
                // token
            });

            let read=[];
            let write=[];
            this.contract.abi.forEach(a => {
                if(a.type!=='function') return;

                if(a.stateMutability==='view') {
                    read.push(a);
                } else {
                    write.push(a);
                }
            });

            this.functions={
                read: this.sortByName(read),
                write: this.sortByName(write)
            };
        },
        sortByName(functions) { //eztodo rename
            return functions.sort((a, b) => {
                const upperA = a.name.toUpperCase()
                const upperB = b.name.toUpperCase()
                return (upperA < upperB) ? -1 : (upperA > upperB) ? 1 : 0;
            })
        }
    },
}
</script>


  }
