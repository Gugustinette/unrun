<script setup lang="ts">
import { ref } from 'vue'

const { type } = defineProps<{
  type?: 'primary'
}>()

const count = ref(0)
</script>

<template>
  <button class="my-button" @click="count++">
    my button<br />
    type: {{ type }}<br />
    count: {{ count }}
  </button>
</template>
