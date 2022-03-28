<script>
import { mapGetters, mapActions } from "vuex";

export default {
  data() {
    return {
      to: null,
      amount: null,
      memo: null,
      showTransaction: null,
      transaction: null,
      explorerUrl: process.env.NETWORK_EXPLORER
    };
  },
  computed: {
    ...mapGetters("account", ["isAuthenticated", "accountName"])
  },
  methods: {
    ...mapActions("account", ["accountExists"]),
    async send() {
      if (!(await this.accountExists(this.to))) {
        this.$q.notify({
          type: "negative",
          message: `Account ${this.to} does not exist`
        });
        return;
      }

      const actions = [
        {
          account: "eosio.token",
          name: "transfer",
          data: {
            from: this.accountName.toLowerCase(),
            to: this.to,
            quantity: `${parseFloat(this.amount).toFixed(4)} TLOS`,
            memo: this.memo
          }
        }
      ];
      const transaction = await this.$store.$api.signTransaction(actions);
      if (transaction) {
        this.showTransaction = true;
        this.transaction = transaction.transactionId;
      }
    }
  }
};
</script>

<template lang='pug'>
  q-page.column.justify-center.items-center
    h2 Send some TLOS!
    div( v-if="isAuthenticated" )
      q-input(
        outlined
        autocapitalize="off"
        bottom-slots
        v-model="to"
        label="To"
        counter
        maxlength="12"
      )
      q-input(
        outlined
        bottom-slots
        suffix="TLOS"
        v-model="amount"
        label="Amount"
        counter
        type="number"
        maxlength="12"
      )
      q-input(
        outlined
        bottom-slots
        v-model="memo"
        label="Memo"
        counter
      )
      q-btn( size="xl" round dense flat icon="send" @click="send" )
      q-dialog( v-model="showTransaction" confirm)
        q-card 
          q-card-section.row 
            q-avatar( icon="arrow_forward" color="primary" text-color="white" )
            span.q-ml-sm
              | Transaction sent, click to view in block explorer.
            q-item.q-ml-sm(
              clickable
              tag="a"
              target="_blank"
              :href="`${explorerUrl}/transaction/${transaction}`"
            ) {{ transaction }}
          q-card-actions( align="right" )
            q-btn( flat label="Ok" color="primary" v-close-popup )
    div( v-else ) Please login to do a transfer!
</template>