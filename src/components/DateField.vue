<template lang="pug">
  div() {{ friendlyDate }}
</template>

<script>
const moment = require('moment');

export default {
  name: "DateField",
  props: {
    epoch: {
      type: Number,
      required: true
    }
  },
  computed: {
    friendlyDate ()  {
      return moment.unix(this.epoch).fromNow() + ` (${ moment.unix(this.epoch).format("MMMM Do YYYY, h:mm:ss a")})`
    }
  }
}
</script>

<style scoped>

</style>
