<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue';
import QRious from 'qrious';
import { watch } from 'vue';

const props = defineProps({
    address: {
        type: String,
        required: true,
    },
    size: {
        type: Number,
        default: 235,
    },
});

const qrInstance = ref<QRious>();
const showCode = ref(false);

function showQrCode(){
    showCode.value = true;
    nextTick().then(() => {
        document.getElementById('qr-code')?.appendChild(qrInstance.value?.image as HTMLImageElement);
    });
}

onMounted(() => {
    qrInstance.value = new QRious({
        background: 'white',
        level: 'H',
        size: props.size,
        value: props.address,
    });
});

watch(showCode, (value) => {
    // This is a workaround for the issue with the dialog not scrolling to the top
    // https://github.com/telosnetwork/teloscan/issues/625
    if (!value) {
        // what for the scroll and if it moves, correct it and end
        const timer = setInterval(() => {
            if (window.scrollY > 0) {
                window.scrollTo({ top: 0, behavior: 'instant' });
                clearInterval(timer);
            }
        }, 0);
        // avoid the interval to run forever
        setTimeout(() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            clearInterval(timer);
        }, 100);
    }
});


</script>

<template>
<q-icon
    name="fas fa-qrcode"
    size="1rem"
    @click="showQrCode"
/>
<q-dialog v-model="showCode" :no-shake='true' position="top">
    <q-card class="qr-dialog">
        <q-card-section class="qr-dialog__header row items-center q-pb-none">
            <div class="qr-dialog__title">Address QR Code</div>
            <q-space />
            <q-btn
                v-close-popup
                icon="close"
                flat
            />
        </q-card-section>
        <q-card-section id="qr-code"  class="qr-dialog__code"/>
        <q-card-section class="qr-dialog__address">
            {{ props.address }}
        </q-card-section>
    </q-card>
</q-dialog>
</template>

<style lang="scss">
.qr-dialog {

    border-radius: 6px !important;
    width: 300px;
    margin-top: 1rem;
    text-align: center;
    &__header{
        border-bottom: 2px solid;
    }
    &__title{
        font-size: 1rem;
    }
    &__code{
        margin: auto;
    }
    &__address{
        font-size: .875rem;
        word-wrap: break-word;
        text-align: center;
    }
}
</style>

