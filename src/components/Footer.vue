<script>
export default {
    name: 'AppFooter',
    methods: {
        currentFullYear() {
            const current = new Date();
            return current.getFullYear();
        }
    }
};
</script>

<template lang='pug'>
  .row.q-mb-lg.relative-bottom
    .col-xs-12.col-md-6
      .column.items-center
        span COPYRIGHT © {{ currentFullYear() }}
          a( href="/" target="_blank" rel="noopener noreferrer")
            | Teloscan
          span.d-none.d-sm-inline-block All rights Reserved
    .col-xs-12.col-md-6
      .column.items-center
        span.float-md-right.d-none.d-md-block.float-right
          | Made with
          q-icon.q-pl-sm(
            name="fas fa-heart red"
            style="font-size:15px;color:red;padding-bottom:4px"
          )
          | +
          q-icon.q-pr-sm(
            name="fas fa-coffee red"
            style="font-size:15px;color:brown;padding-bottom:4px"
          )
          | by
          a(
            href="https://eosauthority.com/vote/producers?network=telos"
            target="_blank"
          ) Yknot &
          a(
            href="https://eosauthority.com/vote/producers?network=telos"
            target="_blank"
          ) Caleos
</template>
