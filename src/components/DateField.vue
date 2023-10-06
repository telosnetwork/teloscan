<script>
import { getFormattedUtcOffset } from 'src/lib/utils';

import moment from 'moment';

export default {
    name: 'DateField',
    props: {
        epoch: {
            type: Number,
            required: true,
        },
        // if true, the component will display plain-english e.g. "3 minutes ago" on initial load; if false, it will
        // display long format e.g. "Jan 6, 2023 11:41:40 (UTC -05:00)"
        defaultToAge: {
            type: Boolean,
            default: true,
        },
        // a value of true or false will force the component to display plain-english age or date stamp respectively;
        // the default value of null will allow the component to toggle itself via user clicks.
        // having a value defined for this prop will disable user click interaction
        forceShowAge: {
            type: Boolean,
            default: null,
        },
    },
    data: () => ({
        showAge: false,
    }),
    computed: {
        friendlyDate ()  {
            const showAge = this.forceShowAge === true || (this.forceShowAge === null && this.showAge);

            if (showAge) {
                return moment.unix(this.epoch).fromNow();
            }

            const offset = getFormattedUtcOffset(new Date(this.epoch));
            return `${moment.unix(this.epoch).format('MMM D, YYYY HH:mm:ss')} (UTC ${offset})`;
        },
    },
    created() {
        this.showAge = this.defaultToAge;
    },
    methods: {
        toggleDisplay() {
            this.showAge = !this.showAge;
        },
    },
};
</script>

<template>
<div
    :class="{
        'c-date-field': true,
        'c-date-field--clickable': forceShowAge === null,
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
}
</style>
