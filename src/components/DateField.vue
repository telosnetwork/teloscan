<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import moment from 'moment';

import { getFormattedUtcOffset } from 'src/lib/utils';
import { formatTimePeriod } from 'src/lib/date-utils';

const { t: $t } = useI18n();

const props = defineProps({
    epoch: {
        type: Number,
        required: true,
    },
    defaultToAge: {
        type: Boolean,
        default: true,
    },
    forceShowAge: {
        type: Boolean,
        default: null,
    },
    utc: {
        type: Boolean,
        default: true,
    },
    mutedText: {
        type: Boolean,
        default: false,
    },
});

const showAge = ref(props.defaultToAge);

const friendlyDate = computed(() => {
    const showAgeValue = props.forceShowAge === true || (props.forceShowAge === null && showAge.value);
    if (showAgeValue) {
        const difference = Date.now() - props.epoch * 1000;
        return $t('antelope.words.time_ago', { time: formatTimePeriod(difference / 1000, $t) });
    }
    const timestamp = moment.unix(props.epoch);
    if (props.utc) {
        return moment.utc(timestamp).format('YYYY-MM-DD HH:mm:ss');
    } else {
        const offset = getFormattedUtcOffset(new Date(props.epoch * 1000));
        const offsetString = ` (UTC ${offset})`;
        return `${timestamp.format('YYYY-MM-DD HH:mm:ss')} ${offsetString}`;
    }
});

function toggleDisplay() {
    if (props.forceShowAge === null) {
        showAge.value = !showAge.value;
    }
}
</script>

<template>
<div
    :class="{
        'c-date-field': true,
        'c-date-field--clickable': forceShowAge === null,
        'c-date-field--muted': mutedText,
    }"
    @click="toggleDisplay"
>
    {{ friendlyDate }}
    <template v-if="forceShowAge === null">
        <q-icon class="fas fa-info-circle q-mr-xs" />
        <q-tooltip>{{ $t('components.click_to_change_format') }}</q-tooltip>
    </template>
</div>
</template>

<style lang="scss">
.c-date-field {
    max-width: max-content;
    display: inline-flex;
    gap: 4px;
    justify-content: flex-start;
    align-items: center;

    &--clickable {
        cursor: pointer;
    }

    &--muted {
        color: var(--grey-text-color);
        font-size: 0.8rem;
    }
}
</style>
