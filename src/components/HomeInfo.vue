<template>
  <div class="row homeInfo">
    <div class="col-xs-6 col-md-3 q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">TLOS Price</div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">$ {{tlosPrice}}</div>
        </div>
      </div>
    </div>

    <div class="col-xs-6 col-md-3 q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">TLOS Market Cap</div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">
            $270,171,568.58
          </div>
        </div>
      </div>
    </div>

    <div class="col-xs-6 col-md-3 q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">
            Transaction Count
          </div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">
            45,487,249,587
          </div>
        </div>
      </div>
    </div>

    <div class="col-xs-6 col-md-3 q-pa-md">
      <div class="row items-center">
        <div class="col-12 items-center">
          <div class="column items-center text-subtitle2">Blocks</div>
        </div>

        <div class="col-12">
          <div class="column items-center text-h6 text-weight-bold">
            186,427,544
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {mapGetters, mapActions} from "vuex"

export default {
  name:"HomeInfo",
  computed: mapGetters("general",['tlosPrice']),
  methods: {...mapActions("general", ["fetchTlosPrice"])},
  components: {},
  created(){
    this.fetchTlosPrice();
  }
};
</script>

<style lang="scss" scoped></style>
