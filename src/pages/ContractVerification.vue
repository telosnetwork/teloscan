<template lang='pug'>
.pageContainer.row.q-pt-xl.tableWrapper
  .text-h4.text-primary.q-mb-lg Verify Contract
  .col-12.q-py-lg
    .ContentContainer
      q-tabs.ContentContainer.text-white(
        v-model="tab"
        dense
        active-color="secondary"
        align="justify"
        narrow-indicator
      )
        q-route-tab.topRounded(
          name="options"
          :to="{ hash: '' }"
          exact
          replace
          label="Options"
        )
        q-route-tab.topRounded(
          name="results"
          :to="{ hash: '' }"
          exact
          replace
          label="Results"
        )
        q-route-tab.topRounded(
          name="details"
          :to="{ hash: '' }"
          exact
          replace
          label="details"
        )

      q-tab-panels.column.ContentContainer.shadow-2(
        v-model="tab"
        animated
        keep-alive
      )
        q-tab-panel.inputs-container(name="options")
          q-form(
            @submit='verifyContract'
            @reset='resetForm'
          )
            q-input.input-field(
              v-model="contractAddress" 
              name='contractAddress'
              label="Contract Address *" 
              placeholder="Please enter contract address '0x0123...'"
              :rules="[val => isValidAddressFormat(val) || 'invalid address format' ]"
            )
            q-select( 
              v-model="compilerVersion" 
              :options="compilerOptions" 
              label="Compiler Version *" 
              :rules="[val => val.length || 'select compiler version']"
            )
            q-select( v-model="targetEvm" :options="evmOptions" label="Target EVM")
            q-toggle( v-model="optimizer" label="Optimization" )
            q-input.input-field(
              v-model="runs" 
              type="number" 
              label="Runs value for optimization" 
              :disable='!optimizer'
            )
            q-radio( 
              v-model="inputMethod"
              label="upload file"
              :val='true'
              color='primary'
            )
            q-radio( 
              v-model="inputMethod"
              label="text input"
              :val='false'
              color='primary'
            )
            q-input.input-field(
              v-if='requiresFileName'
              v-model="sourceName" 
              label="Source path & file name *"
              placeholder="name used for deployment (e.g.,contract.sol, contracts/contract.sol, etc.)"               
              :rules="[val => val.length || 'enter source name']"
            )
            q-input(
              v-if='!inputMethod'
              type="textarea" 
              name='contractInput'
              rows="10"  
              square 
              outlined 
              v-model='contractInput' 
              placeholder='copy & paste contract code here...'
              :rules="[val => val.length || 'enter or paste contract text']"
            )
            div(v-else)
              q-radio( 
                v-model="fileType"
                label=".sol"
                :val='true'
                color='primary'
              )
              q-radio( 
                v-model="fileType"
                label=".json"
                :val='false'
                color='primary'
              )
              q-uploader(
                ref="uploader"
                label="upload .sol contract or .json input file"
                no-thumbnails=true
                :max-files="1"
                style="max-width: 300px"
                accept='.sol, .json'
                hide-upload-btn=true
                @rejected="onNotify"
              )
            div
              q-btn(label="Verify Contract" type="submit" color='primary')
              q-btn(label="Reset" type="reset" color='primary' )
</template>

<script>
//@TODO add `batch` and `multiple` attributes to q-uploader component when multiple files enabled
import axios from 'axios';
import { getCompilerOptions } from 'src/lib/contractVerification';
import { isValidAddressFormat } from "src/lib/utils";


export default {
  name: "ContractVerification",
  data() {
    return {
      tab: "options",
      compilerOptions: [],
      compilerVersion: '',
      contractAddress: '',
      rawInput: false,
      optimizer: false,
      runs: 200,
      constructorArgs: [],
      evmOptions: [ 'telos mainnet', 'telos testnet' ],
      targetEvm: 'telos mainnet',
      TEN_SECONDS: 10000,
      inputMethod: true,
      sourceName: '',
      contractInput: '',
      fileType: true
    };
  },
  async mounted() {
      this.compilerOptions = await getCompilerOptions();
  },
  computed: {
    requiresFileName() {
      return !this.inputMethod || (this.inputMethod && this.fileType);
    }
  },
  methods: {
    isValidAddressFormat,
    setCompiler(option){
      this.compilerVersion = option;
    },
    setEvm(option){
      this.targetEvm = option;
    },
    onNotify(notification){
      if (typeof notification !== 'object' || !notification.hasOwnProperty('message')){
        notification = { message: JSON.stringify(notification), type: 'negative'};
      }
      this.$q.notify({
          type: notification.type,
          position: 'top',
          message: notification.message,
          timeout: this.TEN_SECONDS
      });
    },
    async verifyContract(test){
      const formData = new FormData();
      if (this.$refs.uploader){
        if (this.$refs.uploader.files.length === 0){
          this.onNotify({type: 'info', message: 'you must select a file for upload or toggle input to paste contract contents'});
          return;
        }
        for (const file of this.$refs.uploader.files){
          formData.append('files', file);
        }
      }else{
        formData.append('files', this.contractInput);
      }
      formData.append('sourceName', this.sourceName);
      formData.append('contractAddress', this.contractAddress);
      formData.append('compilerVersion', this.compilerVersion);
      formData.append('optimizer', this.optimizer);
      formData.append('runs', this.runs);
      formData.append('constructorArgs', this.constructorArgs);
      formData.append('targetEvm', this.targetEvm);
      try{
        const result = await axios.post( 'http://localhost:9999/v1/contracts/verify',
          formData,
          {
            onUploadProgress: (progressEvent) => {
              debugger;
              // Math.round((progressEvent.loaded / progressEvent.total) * 100) / 100)
              // this.$refs.uploader.uploaded = progressEvent.loaded;
            }
          });
        this.onNotify(result.data);
      }catch(e){
        this.onNotify({ message: e, type: 'negative'});
      }
    }, 
    resetForm(){
      this.contractAddress = '';
      this.compilerVersion = '';
      this.sourceName = '';
      this.contractInput = '';  
      this.rawInput = false;
      this.optimizer = false;
      this.runs = 200;
      if (this.$refs.uploader){
        this.$refs.uploader.files = []
      }
    }
  }
}
</script>

<style scoped lang="scss">
span {
  word-wrap: break-word;
}
.q-btn {
    width: 45%;
}
.q-btn-dropdown, .q-uploader, .q-toggle, .q-field,.q-btn, .dropdown-selection{
  margin-top: 1rem;
  margin-left: 1rem;
  margin-right: 1rem;
}
.q-uploader{
  margin-top: 1rem;
  max-width: unset !important;
  width:100%;
}
.inputs-container {
  max-width: 100%;
}
.input-field{
  margin: 1rem;
}
</style>
