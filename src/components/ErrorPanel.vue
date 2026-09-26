<script setup lang="ts">
import { computed } from 'vue'
import { MAX_REPORTED_ERRORS } from '../config'

const props = defineProps<{
  errors: readonly string[]
}>()

defineEmits<{
  retry: []
}>()

const shownErrors = computed(() => props.errors.slice(0, MAX_REPORTED_ERRORS))
const hiddenCount = computed(() => Math.max(0, props.errors.length - MAX_REPORTED_ERRORS))
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-12">
    <section role="alert" class="rounded-3xl bg-white p-8 text-ink shadow-2xl">
      <h1 class="text-4xl font-black text-wrong">The contest could not be loaded</h1>
      <p class="mt-3 text-xl">
        Teacher: fix <code class="rounded bg-slate-100 px-2">public/contest.json</code> or the connection, then press Retry.
        The game will not start with missing or broken questions.
      </p>
      <ul class="mt-5 list-disc space-y-1 pl-6 text-lg">
        <li v-for="(error, index) in shownErrors" :key="index">{{ error }}</li>
      </ul>
      <p v-if="hiddenCount > 0" class="mt-2 text-lg font-semibold">…and {{ hiddenCount }} more problems.</p>
      <button type="button" class="btn btn-primary mt-6 text-xl" @click="$emit('retry')">Retry</button>
    </section>
  </main>
</template>
