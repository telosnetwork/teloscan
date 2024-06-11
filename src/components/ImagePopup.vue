<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

// Props interface
interface Props {
    title: string;
    image: string;
    previewSize: number
}

const props = defineProps<Props>();
const { t: $t } = useI18n();

// Reactive variables
const isPopupVisible = ref(false);
const isExpanded = ref(false);

// Methods
const togglePopup = () => {
    isPopupVisible.value = !isPopupVisible.value;
};

const toggleExpand = () => {
    isExpanded.value = !isExpanded.value;
};

const downloadImage = () => {
    const link = document.createElement('a');
    link.href = props.image;
    link.download = 'downloaded-image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const previousScrollY = ref(0);
watch(isPopupVisible, (value) => {
    // This is a workaround very related to the issue with the dialog not scrolling to the top
    // https://github.com/telosnetwork/teloscan/issues/625
    if (value) {
        previousScrollY.value = window.scrollY;
    } else {
        // what for the scroll and if it moves, correct it and end
        const timer = setInterval(() => {
            if (window.scrollY > 0) {
                window.scrollTo({ top: previousScrollY.value, behavior: 'instant' });
                clearInterval(timer);
            }
        }, 0);
        // avoid the interval to run forever
        setTimeout(() => {
            window.scrollTo({ top: previousScrollY.value, behavior: 'instant' });
            clearInterval(timer);
        }, 100);
    }
});

watch(() => props.previewSize, () => {
    console.log('props.previewSize', props.previewSize);
});

</script>

<template>
<div class="c-image-viewer">
    <img
        :src="props.image"
        :width="props.previewSize"
        class="c-image-viewer__thumbnail"
        alt="thumbnail"
        @click="togglePopup"
    >
    <q-dialog v-model="isPopupVisible">
        <q-card
            :class="{
                'c-image-viewer__popup': true,
                'c-image-viewer__popup--expanded': isExpanded
            }"
        >
            <q-card-section class="c-image-viewer__header">
                <div>{{ props.title }}</div>
                <div>
                    <q-btn
                        flat
                        dense
                        :icon="isExpanded ? 'crop_original': 'crop_free'"
                        :class="{'c-image-viewer__header-btn--selected': isExpanded}"
                        @click="toggleExpand"
                    >
                        <q-tooltip>{{ $t('components.toggle_expand') }}</q-tooltip>
                    </q-btn>
                    <q-btn
                        flat
                        dense
                        icon="file_download"
                        @click="downloadImage"
                    >
                        <q-tooltip>{{ $t('components.download_image') }}</q-tooltip>
                    </q-btn>
                    <q-btn
                        flat
                        dense
                        icon="close"
                        @click="togglePopup"
                    >
                        <q-tooltip>{{ $t('components.close') }}</q-tooltip>
                    </q-btn>
                </div>
            </q-card-section>
            <q-card-section class="c-image-viewer__body" @click="toggleExpand">
                <div
                    v-if="isExpanded"
                    :style="{ backgroundImage: `url(${props.image})` }"
                    class="c-image-viewer__image c-image-viewer__image--embeded"
                    alt="full size"
                ></div>
                <img
                    v-else
                    :src="props.image"
                    :class="{
                        'c-image-viewer__image': true,
                    }"
                    alt="full size"
                >
            </q-card-section>
        </q-card>
    </q-dialog>
</div>
</template>

<style lang="scss">
.c-image-viewer {
    &__thumbnail {
        cursor: pointer;
    }

    &__popup {
        --full-width: auto;
        --full-height: auto;
        width: var(--full-width);
        height: var(--full-height);
        &--expanded {
            --full-width: 98vw;
            --full-height: 98vh;
        }
        background-color: var(--bg-color);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        max-width: none !important;
    }

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background-color: var(--header-bg-color);
        padding: 0.5rem;
        color: var(--text-color);

        &-btn--selected {
            background-color: var(--btn-s-bg-color);
            color: var(--btn-s-color);
        }
    }

    &__body {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
    }

    &__image {
        max-width: 100%;
        max-height: 100%;
    }

    &__image--embeded {
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        width: 100%;
        height: 100%;
    }

    &__image--original {
        max-width: none;
        max-height: none;
    }
}
</style>
