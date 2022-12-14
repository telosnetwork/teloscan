<template>
<div class="c-footer row">
    <div class="col-12">
        <router-link to="/">
            Teloscan
        </router-link>
        &copy;&nbsp;{{ year }}
    </div>
</div>
</template>

<script>
export default {
    name: 'AppFooter',
    data: () => ({
        year: (new Date()).getFullYear(),
    }),
};
</script>

<style lang="scss">
body.body--light .c-footer {
    color: $white
}
.c-footer {
    margin: 8px auto 24px;
    padding: 0 16px;
    max-width: 1200px;
}
</style>
