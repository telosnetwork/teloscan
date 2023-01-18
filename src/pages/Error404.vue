<script>
export default {
    name: 'Error404Page',
};
</script>

<template lang='pug'>
.fullscreen.bg-blue.text-white.text-center.q-pa-md.flex.flex-center
    div
      div( style="font-size: 30vh" )
        | 404
      .text-h2( style="opacity:.4" )
        | {{ $t('pages.oops') }}
      q-btn.q-mt-xl(
        color="white"
        text-color="blue"
        unelevated
        to="/"
        :label="$t('pages.go_home')"
        no-caps
      )
</template>
