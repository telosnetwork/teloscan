<template>
<div class="row">
    <div class="col-12">
        <p class="text-h5">Inputs</p>
    </div>
    <q-card class="col-12">
        <div class="row q-pa-md">
            <div class="col-3">
                <base-text-input label="Base Text Input" name="base input" />
            </div>
        </div>

    </q-card>
</div>
</template>

<script>
import BaseTextInput from 'components/inputs/BaseTextInput';

export default {
    name: 'InputDemo',
    components: {
        BaseTextInput,
    },
}
</script>

<style scoped>

</style>
