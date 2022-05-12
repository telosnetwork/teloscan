<script>
const searchHints = ["Transaction", "Address", "Block"];

export default {
  name: 'SearchBar',
  props: {
    toolbar: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchTerm: null,
      searchHint: searchHints[0],
      searchHintIndex: 0,
      TIME_DELAY: 6000
    };
  },
  mounted() {
    setInterval(() => {
      this.searchHintIndex =
        this.searchHintIndex == searchHints.length - 1
          ? 0
          : ++this.searchHintIndex;
      this.searchHint = searchHints[this.searchHintIndex];
    }, 2000);
  },
  methods: {
    async search() {
      if (!this.searchTerm)
        return;

      this.searchTerm = this.searchTerm.trim().replace(/\s/, '');
      if (this.searchTerm.startsWith("0x")) {
        if (this.searchTerm.length == 42) {
          this.$router.push(`/address/${this.searchTerm}`);
          return;
        } else {
          this.$router.push(`/tx/${this.searchTerm}`);
          return;
        }
      } else if (this.searchTerm.match(/(^[a-z1-5.]{1,11}[a-z1-5]$)|(^[a-z1-5.]{12}[a-j1-5]$)/)) {
        try {
          const account = await this.$evm.telos.getEthAccountByTelosAccount(this.searchTerm);
          this.$router.push(`/address/${account.address}`);
          return;
        } catch (e) {
          // in case this was a block that looked like an account name let's try it as a block
          if (this.searchTerm && !isNaN(this.searchTerm)) {
            this.$router.push(`/block/${this.searchTerm}`);
            return;
          }

          this.$q.notify({
            position: 'top',
            message: `Search for EVM address linked to ${this.searchTerm} native account failed.`,
            timeout: this.TIME_DELAY
          });
          return;
        }
      } else if (!isNaN(this.searchTerm)) {
        this.$router.push(`/block/${this.searchTerm}`);
        return;
      }

      this.$q.notify({
        position: 'top',
        message: "Search failed, please enter a valid search term.",
        timeout: this.TIME_DELAY
      });
    }
  }
};
</script>

<template lang='pug'>
div
  q-input.q-ml-md(
    v-if="this.toolbar"
    dark
    dense
    standout
    input-class="text-right"
    :placeholder="searchHint"
    v-model="searchTerm"
    @keydown.enter="search"
  )
    template( v-slot:append )
      q-icon( v-if="searchTerm == null" name="search" )
      q-icon.cursor-pointer( v-else name="clear" @click="searchTerm = null" )
  q-input(
    v-if="!this.toolbar"
    borderless
    :placeholder="searchHint"
    v-model="searchTerm"
    @keydown.enter="search"
  )
    template( v-slot:append )
      q-icon.cursor-pointer(
        v-if="searchTerm !== null"
        name="close"
        @click="searchTerm = null"
      )
      q-icon( name="search" @click="search" )
</template>
