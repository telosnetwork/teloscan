<script>
export default {
    name: 'DemoIndex',
    methods: {
        toggleDarkMode() {
            this.$q.dark.toggle();
            localStorage.setItem('darkModeEnabled', this.$q.dark.isActive);
        },
    },
};
</script>

<template>
<div class="c-demos">
    <div class="row q-mb-sm">
        <div class="col u-flex--left text-white">
            <div class="text-h3">Component Demos</div>
            <q-btn
                flat
                standout
                class="q-mx-md"
                :icon="$q.dark.isActive ? 'fas fa-sun' : 'fas fa-moon'"
                @click="toggleDarkMode()"
            />
        </div>
    </div>
    <div class="row q-mb-xl">
        <q-card class="col-3">
            <div class="q-pa-md text-left">
                Pages
                <ul class="c-demos__ul">
                    <li>
                        <router-link :to="{ name: 'inputs-demo' }">Inputs</router-link>
                    </li>
                </ul>
            </div>
        </q-card>
    </div>
    <div class="row">
        <div class="col-12">
            <router-view />
        </div>
    </div>
</div>
</template>

<style lang="scss">
.c-demos {
    margin: 24px;

    &__ul {
        padding-left: 12px;
    }
}
</style>
