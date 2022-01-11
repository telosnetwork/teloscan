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
          .compiler-version(v-show='compilerVersion.length') Selected: {{ compilerVersion }}
          q-uploader(
            :factory='uploadFiles'
            :disabled='!hasRequired'
            label="upload solidity files"
            no-thumbnails=true
            :form-fields='getFormData'
            :max-files="1"
            :max-file-size='contractLimit'
            style="max-width: 300px"
            accept='.sol'
            @rejected="onRejected"
          )
          q-toggle( v-model="optimized" label="Optimization")
          q-input.input-field(v-model="runs" label="Runs value for optimization" )
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
      optimized: false,
      runs: 200,
      constructorArgs: [],
      contractByteLimit: 24577 
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
    getFormData(){
      debugger;
      return [
        {name: 'compilerVersion', value: this.compilerVersion},
        {name: 'contractAddress', value: this.contractAddress},
        {name: 'optimized', value: this.optimized},
        {name: 'runs', value: this.runs},
        {name: 'constructorArgs', value: this.constructorArgs}
      ]
    },
    onRejected(e){
      const errorMessage = JSON.stringify(e);
      this.$q.notify({
          type: "negative",
          position: 'top',
          message: `Error: ${errorMessage}`
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
      formData.append('optimized', this.optimized);
      formData.append('runs', this.runs);
      formData.append('constructorArgs', this.constructorArgs)
      try{
        await axios.post( 'http://localhost:9999/v1/contracts/verify',
          formData,
          {
            onUploadProgress: (progressEvent) => {
              //@TODO update progress method: updateProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100) / 100)
            }
          });
      }catch(e){
        console.log(e);
      }

    }
  }
}
</script>

<style scoped lang="scss">
.q-uploader{
  margin-top: 1rem;
}
span {
  word-wrap: break-word;
}
.inputs-container {
  max-width: 27rem;
}
.input-field{
  margin:1rem;
}
</style>
