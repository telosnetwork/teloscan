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
          q-input.input-field(v-model="contractAddress" label="Contract Address" placeholder="Please enter contract address '0x0123...'")
          q-btn-dropdown(color="primary" label="Select Compiler Version" )
              q-list
                  q-item(v-for="option in compilerOptions" :key='option' clickable v-close-popup @click='setCompiler(option)')
                      q-item-section()
                          q-item-label() {{option}}
          .dropdown-selection(v-show='compilerVersion.length') Selected: {{ compilerVersion }}
          q-btn-dropdown(color="primary" label="Select Target Evm" )
              q-list
                  q-item(v-for="option in evmOptions" :key='option' clickable v-close-popup @click='setEvm(option)')
                      q-item-section()
                          q-item-label() {{option}}
          .dropdown-selection(v-show='targetEvm.length') Selected: {{ targetEvm }}
          q-toggle( v-model="optimizer" label="Optimization")
          q-input.input-field(v-model="runs" label="Runs value for optimization" )
          q-uploader(
            :factory='uploadFiles'
            :disabled='!hasRequired'
            label="upload solidity files"
            no-thumbnails=true
            :max-files="1"
            style="max-width: 300px"
            accept='.sol'
            @rejected="onNotify"
          )

</template>

<script>
//@TODO add `batch` and `multiple` attributes to q-uploader component when multiple files enabled

import axios from 'axios';
import { getCompilerOptions } from 'src/lib/contractVerification';

export default {
  name: "ContractVerification",
  data() {
    return {
      tab: "general",
      compilerOptions: [],
      compilerVersion: '',
      contractAddress: '',
      optimizer: false,
      runs: 200,
      constructorArgs: [],
      evmOptions: [ 'byzantium', 'tangerineWhistle', 'spuriousDragon', 'constantinople', 'petersburg', 'istanbul', 'berlin', 'london'],
      targetEvm: '',
      TEN_SECONDS: 10000
    };
  },
  async mounted() {
      this.compilerOptions = await getCompilerOptions();
  },
  computed: {
    hasRequired(){
      return this.compilerVersion.length && this.contractAddress.length;
    }
  },
  methods: {
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
    async uploadFiles(fileArray){
      debugger;
      const formData = new FormData();
      for (const file of fileArray){
        formData.append('files', file)
      }
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
              //@TODO update progress method: updateProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100) / 100)
            }
          });
        this.onNotify(result.data);
      }catch(e){
        this.onNotify({ message: e, type: 'negative'});
      }
    }
  }
}
</script>

<style scoped lang="scss">
.q-uploader{
  margin-top: 1rem;
  max-width: unset;
  width:100%;
}
span {
  word-wrap: break-word;
}
.inputs-container {
  max-width: 27rem;
}
.input-field{
  margin: 1rem;
}
.q-btn-dropdown, .q-uploader, .dropdown-selection{
  margin-top: 1rem;
  margin-left: 1rem;
}
.q-btn {
    width: 100%;
}
</style>
