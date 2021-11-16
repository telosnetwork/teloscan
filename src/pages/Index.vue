<template>
  <q-page class="column justify-center items-center">
    <img class="logo" alt="Telos logo" src="~assets/telos-logo-full.png" />
    <h6 class="description">
      Use this template as a starting point for your app and save the time of writing all the boilerplate code.
      It has an implementation of UAL (Universal
      Authenticator Library) which you can test with the Login button.  There are other examples and essential quasar links in the side menu.
    </h6>
  </q-page>
</template>

<script>
export default {
  name: "Index"
};
</script>

<style lang="sass" scoped>
.logo
  max-width: 400px

.description
  max-width: 800px
</style>
