<template>
  <q-input bottom-slots :placeholder="searchHint" v-model="searchTerm" @keydown.enter="search" >
    <template v-slot:append>
      <q-icon v-if="searchTerm !== null" name="close" @click="searchTerm = null" class="cursor-pointer" />
      <q-icon name="search" @click="search"/>
    </template>
  </q-input>
</template>

<script>

const searchHints = ['Transaction', 'Address', 'Block'];

export default {
  name: "Search",
  data() {
    return {
      searchTerm: null,
      searchHint: searchHints[0],
      searchHintIndex: 0
    };
  },
  mounted() {
    setInterval(() => {
      this.searchHintIndex = this.searchHintIndex == (searchHints.length - 1) ? 0 : ++this.searchHintIndex;
      this.searchHint = searchHints[this.searchHintIndex]
    }, 2000)
  },
  methods: {
    search() {
      if (this.searchTerm.startsWith('0x')) {
        if (this.searchTerm.length == 42) {
          this.$router.push(`/address/${this.searchTerm}`);
        } else {
          this.$router.push(`/tx/${this.searchTerm}`);
        }
      }
    }
  }
}
</script>

<style scoped>

</style>
