<template lang='pug'>
.pageContainer.row.q-pt-xl.tableWrapper
  .text-h4.text-primary.q-mb-lg Verify Contract
  .col-12.q-py-lg
    .ContentContainer
          q-form(
            @submit='submitFormHandler'
            @reset='resetForm'
          )
            .inputs-container-row
              .inputs-container-col.inputs-container-padding-right
                q-input(
                  v-model="contractAddress" 
                  name='contractAddress'
                  label="Contract Address *" 
                  placeholder="Please enter contract address '0x0123...'"
                  debounce="500"
                  :rules="[val => isValidAddressFormat(val) || 'invalid address format' ]"
                )
                q-select( 
                  v-model="compilerVersion" 
                  :options="compilerOptions" 
                  label="Compiler Version *" 
                  :rules="[val => val.length || 'select compiler version']"
                )
              .inputs-container-col
                q-input.q-field--with-bottom(
                  v-model="runs" 
                  type="number" 
                  label="Runs value for optimization" 
                  :class="!optimizer ? 'disabled-input' : ''"
                )
                  q-toggle( v-model="optimizer" label="Optimization" )
                q-select( v-model="targetEvm" :options="evmOptions" label="Target EVM" disable)

  
              q-input(
                :disable='!requiresFileName'
                v-model="sourcePath" 
                label="path to source file(s), leave blank if none"
                placeholder="path to source file(s) e.g., 'contracts/'"      
                debounce="500"
                :rules="[val => ((val.length === 0) ||(val.length && val.charAt(val.length - 1) === '/') ) || 'path must end with a forward slash /']"
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
              q-input(
                v-if='!inputMethod'
                type="textarea" 
                name='contractInput'
                rows="8"  
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
                  :val="true"
                  color='primary'
                )
                q-radio( 
                  v-model="fileType"
                  label=".json"
                  :val="false"
                  color='primary'
                )
                q-uploader(
                  ref="uploader"
                  :url='getUrl'
                  multiple
                  batch
                  :label='uploaderLabel'
                  :form-fields='getFormFields'
                  field-name='files'
                  no-thumbnails=true
                  style="max-width: 300px"
                  accept='.sol, .json'
                  hide-upload-btn=true
                  @uploading='uploading'
                  @uploaded='uploaded'
                  @rejected="onNotify"
                  @start='start'
                  @finish='finish'
                )

              .button-container
                q-btn(label="Verify Contract" type="submit" color='primary')
                q-btn(label="Reset" type="reset" color='primary' )
</template>

<script>
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
      sourcePath: '',
      contractInput: '',
      fileType: true
    };
  },
  async mounted() {
      this.compilerOptions = await getCompilerOptions();
      if (this.$route.params.address) this.contractAddress = this.$route.params.address; 
  },
  computed: {
    requiresFileName() {
      return !this.inputMethod || (this.inputMethod && this.fileType);
    },
    uploaderLabel() {
      const solFile = `Select .sol contract file for upload`;
      const jsonFile = 'Select standard JSON input object file for upload';
      return  this.fileType ? solFile : jsonFile;
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
    uploading(e){
      debugger;
    },
    uploaded(e){
      debugger;
    },
    start(e){
      debugger;
    },
    finish(e){
      debugger;
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
    getUrl() {
      return `${process.env.TELOS_API_ENDPOINT}/contracts/verify`;
    },
    async submitFormHandler() {
      debugger;
      console.log(this.$refs.up)
      if (this.$refs.uploader){
        if (this.$refs.uploader.files.length === 0){
          this.onNotify({type: 'info', message: 'you must select a file for upload or toggle input to paste contract contents'});
          return;
        }
        await this.$refs.uploader.upload(); //trigger uploader to call factory with files arg
      }else{
        await this.uploadFiles();
      }
    },

    async uploadFiles(files){
      debugger;
      const formData = this.setFormData();
      if (Array.isArray(files) && files.length > 0){
        for (const file of files){
          formData.append('files', file);
        }
      }else{
        formData.append('files', this.contractInput);
      }

      try{
        const result = await this.$telosApi.post('contracts/verify',
          formData,
          {
            onUploadProgress: (progressEvent) => {
              // const calculatedProgress = Math.round((progressEvent.loaded / progressEvent.total) * 100) / 100;
              debugger;
              this.$refs.uploader.uploadedSize = progressEvent.loaded;
            }
          });
        this.onNotify(result.data);
        debugger; 
        return files;
        // if (result.data.type === "positive"){
        //   this.$$router.push({ name: 'address', params: { address: this.contractAddress}})
        // }
      }catch(e){
        this.onNotify({ message: e, type: 'negative'});
      }
    }, 

    getFormFields(){
      return [
        { name: 'sourcePath', value: this.sourcePath },
        { name: 'contractAddress', value: this.contractAddress },
        { name: 'compilerVersion', value: this.compilerVersion },
        { name: 'optimizer', value: this.optimizer },
        { name: 'runs', value: this.runs },
        { name: 'constructorArgs', value: this.constructorArgs},
        { name: 'targetEvm', value: this.targetEvm },
        { name: 'fileType', value: this.fileType }
      ]
    },

    setFormData(){
      const formData = new FormData();
      formData.append('sourcePath', this.sourcePath);
      formData.append('contractAddress', this.contractAddress);
      formData.append('compilerVersion', this.compilerVersion);
      formData.append('optimizer', this.optimizer);
      formData.append('runs', this.runs);
      formData.append('constructorArgs', this.constructorArgs);
      formData.append('targetEvm', this.targetEvm);
      formData.append('fileType', this.fileType);
      return formData
    },

    resetForm(){
      this.contractAddress = '';
      this.compilerVersion = '';
      this.sourcePath = '';
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

<style scoped lang="sass">
span 
  word-wrap: break-word

.q-btn 
  width: 40%
  margin: auto

.q-uploader
  margin-top: 1rem
  max-width: unset !important
  width:100%

.q-form
  width: 60rem
  margin: auto

.q-select
  height: 3rem

.q-textarea
  margin-top:1.5rem

.q-toggle
  margin-left: 1rem

.q-tab-panel
  margin-bottom: 1.5rem
  margin-top: 1.5rem

.content-container
  margin-top 8rem

.button-container
  display: flex
  margin: 1rem
  padding-top: 1rem
  justify-content: space-around

.inputs-container-padding-right
  padding-right: 2rem

.inputs-container-col
  display: inline-flex
  flex-direction: column
  width: 48%
  height:10rem
  margin: auto

.inputs-container-row
  display:flex
  margin: auto
  justify-content: space-around

</style>
