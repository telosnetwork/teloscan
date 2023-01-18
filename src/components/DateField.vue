<script>
const moment = require('moment');

export default {
    name: 'DateField',
    props: {
        epoch: {
            type: Number,
            required: true,
        },
        showAge: {
            type: Boolean,
            default: true,
        },
    },
    computed: {
        friendlyDate ()  {
            if (this.showAge) {
                return moment.unix(this.epoch).fromNow();
            }
            return  `${ moment.unix(this.epoch).format('YYYY-MM-DD h:mm:ss')}`;
        },
    },
};
</script>

<template lang="pug">
div.c-date-field {{ friendlyDate }}
</template>

<style lang="scss">
.c-date-field {
    cursor: pointer;
    max-width: max-content;
}
</style>
