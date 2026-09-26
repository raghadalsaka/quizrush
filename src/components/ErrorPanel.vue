<script setup lang="ts">
defineEmits<{
  retry: []
}>()
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-12">
    <section role="alert" class="rounded-3xl bg-white p-8 text-ink shadow-2xl">
      <h1 class="text-4xl font-black text-wrong">The quiz couldn't be loaded</h1>
      <p class="mt-3 text-xl">Please check the internet connection and try again.</p>
      <button type="button" class="btn btn-primary mt-6 text-xl" @click="$emit('retry')">Try again</button>
    </section>
  </main>
</template>
