<script setup lang="ts">
defineEmits<{
  retry: []
}>()
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-12">
    <section role="alert" class="panel grid justify-items-start gap-4 p-8">
      <h1 class="font-display text-4xl leading-tight font-extrabold text-bad">The quiz couldn't be loaded</h1>
      <p class="text-xl">Please check the internet connection and try again.</p>
      <button type="button" class="btn btn-primary mt-2 text-xl" @click="$emit('retry')">Try again</button>
    </section>
  </main>
</template>
