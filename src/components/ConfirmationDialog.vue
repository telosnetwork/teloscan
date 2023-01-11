<script>
const VIEW_SOURCE_PROMPT = 'This contract has been verified. You can view the source code & metadata in the \'contract\' tab';
const VERIFY_PROMPT = 'This contract has not been verified.  Would you like to upload the contract(s) and metadata to verify source now?';

export default {
    name: 'ConfirmationDialog',
    components: {},
    props: {
        flag: {
            type: Boolean,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        status: {
            type: Boolean,
            default: false,
        },
    },
    data() {
        return {
            showDialog: false,
            icon: 'warning',
            color: 'text-negative',
            dialogMessage: VERIFY_PROMPT,
        }
    },
    watch: {
        flag(val){
            this.showDialog = val;
        },
        status(val){
            if (val) {
                this.icon = 'verified';
                this.color = 'text-positive';
                this.dialogMessage = VIEW_SOURCE_PROMPT;
            }else{
                this.icon = 'warning',
                this.color = 'text-negative',
                this.dialogMessage = VERIFY_PROMPT;
            }
        },
        showDialog(val){
            if (!val) this.$emit('dialog', val);
        },
    },
    methods: {
        async navigate(){
            await this.$router.push({name:'sourcify'});
        },
    },
}
</script>

<template lang="pug">
q-dialog( v-model="showDialog" persistent)
      q-card
        q-card-section.rows.items-center
          q-icon(:name='icon' :class='color' size='1.25rem' text-color="white")
          span.q-ml-sm {{ dialogMessage }}
        q-card-actions(align="right")
          q-btn(flat label="Dismiss" color="primary" v-close-popup)
          q-btn(v-if="!status" flat :label="$t('components.verify_contract')" color="primary" v-close-popup @click="navigate")
</template>
