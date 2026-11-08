<script setup lang="ts">
import { EMOJI_POOL } from '../config'

const emoji = defineModel<string>({ required: true })

defineProps<{
  label: string
}>()
</script>

<template>
  <select v-model="emoji" class="field-input w-20 shrink-0 px-2 py-1 text-2xl" :aria-label="label">
    <option v-for="choice in EMOJI_POOL" :key="choice" :value="choice">{{ choice }}</option>
  </select>
</template>
