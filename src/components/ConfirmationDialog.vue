<template lang="pug">
    q-dialog( v-model="showDialog" persistent)
      q-card
        q-card-section.rows.items-center 
          q-icon(:name='icon' :class='color' size='1.25rem' text-color="white")
          span.q-ml-sm {{ dialogMessage }} 
        q-card-actions(align="right")
          q-btn(flat label="Dismiss" color="primary" v-close-popup)
          q-btn(flat label="Verify Contract" color="primary" v-close-popup @click="navigate")
</template>
<script lang="ts">


export default {
  name: "ConfirmationDialog",
  components: {},
  data() {
    return {
      showDialog: false,
      icon: 'warning',
      color: 'text-red',
      dialogMessage: `This contract has not been verified. 
          Upload contract to verify source now?`
    }
  },
  props: {
    flag: {
      type: Boolean,
      required: true
    },
    address: { 
      type: String,
      required: true
    },
    status: {
      type: Boolean,
      default: false
    },
    date: {
      type: String,
      default: ''
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
      debugger;
      this.showDialog = val;
    },
    status(val){
      if (val) {
        this.icon = 'verified';
        this.color = 'text-green';
        this.dialogMessage = `This contract was verified on ${this.date}. 
          Would you like to view contract source code?`;
      }else{
        this.icon = 'warning',
        this.color = 'text-red',
        this.dialogMessage = `This contract has not been verified. 
          Upload contract to verify source now?`
      }
    },
    showDialog(val){
      if (!val) this.$emit('dialog', val);
    }
  },
  methods: {
    async navigate(){
      await this.$router.push(this.navRoute);
    }
  } 
}
</script>