<template>
  <q-page class="column justify-center items-center">
    <img class="logo" alt="Telos logo" src="~assets/telos-logo-full.png" />
    <search></search>

  </q-page>
</template>

<script>
import Search from 'components/Search'
export default {
  components: { Search },
  name: "Index"
};
</script>

<style lang="sass" scoped>
.logo
  max-width: 400px

.description
  max-width: 800px
</style>
