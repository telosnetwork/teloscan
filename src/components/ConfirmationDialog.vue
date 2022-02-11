<template lang="pug">
    q-dialog( v-model="showDialog" persistent)
      q-card
        q-card-section.rows.items-center 
          q-icon(:name='icon' :class='color' size='1.25rem' text-color="white")
          span.q-ml-sm {{ dialogMessage }} 
        q-card-actions(align="right")
          q-btn(flat label="Dismiss" color="primary" v-close-popup)
          q-btn(v-if="!status" flat label="Verify Contract" color="primary" v-close-popup @click="navigate")
</template>
<script lang="ts">

import { formatIsoDateTime } from "src/lib/utils";
const VIEW_SOURCE_PROMPT = `This contract has been verified. You can view the source code & settings in the 'contract' tab`;
const VERIFY_PROMPT = 'This contract has not been verified.  Upload contract to verify source now?';

export default {
  name: "ConfirmationDialog",
  components: {},
  data() {
    return {
      showDialog: false,
      icon: 'warning',
      color: 'text-red',
      dialogMessage: VERIFY_PROMPT
    }
  },
  props: {
    flag: {
      type: Boolean || null,
      required: true
    },
    address: { 
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      default: false
    }
  },
  mounted() {

  },
  computed: {
    navRoute(){
      return `/contract/verify/${this.address}`
    }
  },
  watch: {
    flag(val){
      this.showDialog = val;
    },
    status(val){
      if (val) {
        this.icon = 'verified';
        this.color = 'text-green';
        this.dialogMessage = VIEW_SOURCE_PROMPT; 
      }else{
        this.icon = 'warning',
        this.color = 'text-red',
        this.dialogMessage = VERIFY_PROMPT;
      }
    },
    showDialog(val){
      if (!val) this.$emit('dialog', val);
    }
  },
  methods: {
    async navigate(){
      await this.$router.push({name:'sourcify'});
    }
  } 
}
</script>