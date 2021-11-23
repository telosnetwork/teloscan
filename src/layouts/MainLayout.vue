<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>

        <q-toolbar-title @click="$router.push('/')">
          Teloscan
        </q-toolbar-title>

        <search></search>

      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import Search from 'components/Search'
export default {
  name: "MainLayout",
  components: { Search},
  data() {
    return {
    };
  }
};
</script>
