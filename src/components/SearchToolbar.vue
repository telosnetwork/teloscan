<template>

  <q-input dark dense standout v-model="searchTerm" input-class="text-right" @keydown.enter="search" class="q-ml-md">
    <template v-slot:append>
      <q-icon v-if="searchTerm == null" name="search" />
      <q-icon v-else name="clear" class="cursor-pointer" @click="searchTerm = null" />
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
