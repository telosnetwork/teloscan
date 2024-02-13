<script>
import { getCompilerOptions } from 'src/lib/contract/ContractVerification';
import { isValidAddressFormat } from 'src/lib/utils';

export default {
    name: 'ContractVerification',
    data() {
        return {
            tab: 'options',
            compilerOptions: [],
            compilerVersion: '',
            contractAddress: '',
            rawInput: false,
            optimizer: false,
            runs: 200,
            constructorArgs: '',
            evmOptions: [
                'default',
                'homestead',
                'tangerineWhistle',
                'spuriousDragon',
                'byzantium',
                'constantinople',
                'petersburg',
                'istanbul',
                'berlin',
                'london',
            ],
            targetEvm: 'default',
            inputMethod: true,
            sourcePath: '',
            contractInput: '',
            fileType: true,
            TIME_DELAY: 6000,
            sourcePathRules: [
                val => ((val.length === 0) ||
                (val.length && val.charAt(val.length - 1) === '/')) ||
                this.$t('pages.invalid_path_format'),
            ],
            constructorArgsRules: [
                val => ((val.length === 0) ||
                (val.length && val.charAt(val.length - 1) !== ',' && val.charAt(0) !== ',')) ||
                this.$t('pages.no_trailing_commas'),
            ],
        };
    },
    computed: {
        pathInput() {
            return !this.inputMethod || (this.inputMethod && this.fileType);
        },
        uploaderLabel() {
            const solFile = this.$t('pages.select_sol_file');
            const jsonFile = this.$t('pages.select_json_file');
            return  this.fileType ? solFile : jsonFile;
        },
    },
    async mounted() {
        this.compilerOptions = await getCompilerOptions();
        if (this.$route.params.address) {
            this.contractAddress = this.$route.params.address;
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
        uploaded(uploadedObj){
            const verifyResponse = JSON.parse(uploadedObj.xhr.response);
            this.onNotify(verifyResponse);
            if (verifyResponse.type === 'positive'){
                this.navToAddress();
            }
        },
        onNotify(notification){
            let noti = { ...notification };

            if (typeof notification !== 'object' || !Object.prototype.hasOwnProperty.call(notification, 'message')){
                noti = { message: JSON.stringify(notification), type: 'negative' };
            }
            this.$q.notify({
                type: noti.type,
                position: 'top',
                message: noti.message,
                timeout: this.TIME_DELAY,
            });
        },
        navToAddress(){
            setTimeout(() => {
                this.$router.push({ name: 'address', params: { address: this.contractAddress } });
            }, this.TIME_DELAY);
        },
        getUrl() {
            return `${process.env.TELOS_API_ENDPOINT}/contracts/verify`;
        },
        async submitFormHandler() {
            if (this.$refs.uploader){
                if (this.$refs.uploader.files.length === 0){
                    this.onNotify({ type: 'info', message: this.$t('pages.paste_contract_contents') });
                    return;
                }
                await this.$refs.uploader.upload();
            }else{
                await this.uploadForm();
            }
        },

        async uploadForm(){
            const formData = this.getFormData();
            formData.append('files', this.contractInput);
            try{
                const result = await this.$telosApi.general.post('contracts/verify', formData);
                this.onNotify(result.data);
                if (result.data.type === 'positive'){
                    this.navToAddress();
                }
            }catch(e){
                this.onNotify({ message: e, type: 'negative' });
            }
        },

        getFormData(){
            let formFields = this.getFormFields();
            const formData = new FormData();
            for (let i in formFields){
                formData.append(formFields[i].name, formFields[i].value);
            }
            return formData;
        },

        getFormFields(){
            return [
                { name: 'sourcePath', value: this.sourcePath },
                { name: 'contractAddress', value: this.contractAddress },
                { name: 'compilerVersion', value: this.compilerVersion },
                { name: 'optimizer', value: this.optimizer },
                { name: 'runs', value: this.runs },
                { name: 'constructorArgs', value: this.constructorArgs },
                { name: 'targetEvm', value: this.targetEvm },
                { name: 'fileType', value: this.fileType },
            ];
        },

        resetForm(){
            this.contractAddress = '';
            this.compilerVersion = '';
            this.sourcePath = '';
            this.contractInput = '';
            this.rawInput = false;
            this.optimizer = false;
            this.runs = 200;
            this.fileType = true;
            if (this.$refs.uploader){
                this.$refs.uploader.files = [];
            }
        },
    },
};
</script>

<template>
<div class="pageContainer">
    <div class="bg-white q-pa-xl  q-mt-xl">
        <div class="text-h4 text-primary">{{ $t('pages.verify_contract') }}</div>
        <div class="col-12">
            <div class="content-container">
                <q-form @submit="submitFormHandler" @reset="resetForm">
                    <div class="inputs-container-row">
                        <div class="inputs-container-col inputs-container-padding-right">
                            <q-input
                                v-model="contractAddress"
                                name="contractAddress"
                                :label="$t('pages.contract_address')+' *'"
                                :placeholder="$t('pages.enter_contract_address')"
                                debounce="500"
                                :rules="[val => isValidAddressFormat(val) || $t('pages.invalid_address_format')]"
                            />
                            <q-select
                                v-model="compilerVersion"
                                :options="compilerOptions"
                                :label="$t('pages.compiler_version')+' *'"
                                :rules="[val => val.length || $t('pages.select_compiler_version')]"
                            />
                            <q-input
                                v-model="sourcePath"
                                :disable="!pathInput"
                                :label="$t('pages.contract_file_directory_path')"
                                :placeholder="$t('pages.eg_contracts')"
                                debounce="750"
                                :rules="sourcePathRules"
                            />
                            <div class="radio-container">
                                <q-radio
                                    v-model="inputMethod"
                                    :label="$t('pages.upload_file')"
                                    :val="true"
                                    color="secondary"
                                />
                                <q-radio
                                    v-model="inputMethod"
                                    :label="$t('pages.text_input')"
                                    :val="false"
                                    color="secondary"
                                />
                            </div>
                        </div>
                        <div class="inputs-container-col">
                            <q-input
                                v-model="runs"
                                class="q-field--with-bottom"
                                type="number"
                                :label="$t('pages.runs_value_for_optimization')"
                                :class="!optimizer ? 'disabled-input' : ''"
                            >
                                <q-toggle v-model="optimizer" label="Optimization"/>
                            </q-input>
                            <q-select v-model="targetEvm" :options="evmOptions" label="Target EVM"/>
                            <q-input
                                v-model="constructorArgs"
                                :label="$t('pages.constructor_arguments')"
                                :placeholder="$t('pages.comma_seperated_values')"
                                debounce="750"
                                :rules="constructorArgsRules"
                                class="q-pb-sm"
                            />
                            <div class="radio-container">
                                <q-radio
                                    v-if="inputMethod"
                                    v-model="fileType"
                                    label=".sol"
                                    :val="true"
                                    color="secondary"
                                />
                                <q-radio
                                    v-if="inputMethod"
                                    v-model="fileType"
                                    label=".json"
                                    :val="false"
                                    color="secondary"
                                />
                            </div>
                        </div>
                        <q-input
                            v-if="!inputMethod"
                            v-model="contractInput"
                            class="border-radius"
                            type="textarea"
                            name="contractInput"
                            rows="5"
                            square
                            outlined
                            :placeholder="$t('pages.paste_contract_code_here')"
                            :rules="[val => val.length || $t('pages.enter_contract_text')]"
                        />
                        <q-uploader
                            v-else
                            ref="uploader"
                            :url="getUrl"
                            multiple
                            batch="batch"
                            :label="uploaderLabel"
                            :form-fields="getFormFields"
                            field-name="files"
                            no-thumbnails
                            class="uploader"
                            accept=".sol, .json"
                            hide-upload-btn
                            @uploaded="uploaded"
                            @rejected="onNotify"
                        />
                        <div class="button-container">
                            <q-btn :label="$t('pages.verify_contract')" type="submit" color="secondary"/>
                            <q-btn :label="$t('pages.reset')" type="reset" color="secondary"/>
                        </div>
                    </div>
                </q-form>
            </div>
        </div>
    </div>
</div>
</template>

<style scoped lang="sass">
.uploader
  max-width: 300px

span
  word-wrap: break-word

.q-btn
  width: 40%
  margin: auto

.q-uploader
  margin-top: 1rem
  max-width: unset !important
  width: 100%

.q-form
  width: 60rem
  margin: auto

.q-select
  height: 3rem
  margin-bottom: 2rem

.q-textarea, .q-uploader
  -webkit-border-radius: 6px
  -moz-border-radius: 6px
  border-radius: 6px
  margin-top: 10rem

.q-toggle
  margin-left: 1rem

.q-tab-panel
  margin-bottom: 1.5rem
  margin-top: 1.5rem

.content-container
  margin-top: 8rem

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
  height: 10rem
  margin: auto

.inputs-container-row
  margin: auto
  justify-content: space-around

.radio-container
  margin-top: 1rem
</style>
