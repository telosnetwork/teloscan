<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
    name: 'HomePage',
    components: {
    },
    setup() {
        function onChainSelected(chain: string) {
            console.log(chain);
        }

        return {
            onChainSelected,
        };
    },
});
</script>

<template>
<div class="row home-container">
    <div class="col-12 col-sm-8 q-pa-md header-support home-banner">
        <img class="antelope-logo" src="icons/antelope-logo.png">
        <h2>Open Block Explorer</h2>
    </div>
    <div class="col-12 col-sm-4">
        test page
    </div>
</div>
</template>

<style lang="sass" scoped>
.home-container
    height: 100vh

.home-banner
    background-image: url("/backgrounds/home.png")
    background-repeat: no-repeat
    background-position: center
    background-size: cover
    display: flex
    align-items: center
    flex-direction: column
    justify-content: center
    color: white
    text-align: center
    > h2
        font-weight: 400

.antelope-logo
    max-height: 100px

</style>
