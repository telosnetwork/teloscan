<template>
  <q-item clickable
    @click="goTo(path)"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>
        {{ caption }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
export default {
  name: 'EssentialLink',
  props: {
    title: {
      type: String,
      required: true
    },

    caption: {
      type: String,
      default: ''
    },

    path: {
      type: String,
      default: '/'
    },

    icon: {
      type: String,
      default: ''
    }
  },
  methods: {
    goTo(path) {
        if (this.$router.currentRoute.path !== path) {
          this.$router.push({ path: path });
        }
    }
  }
}
</script>
