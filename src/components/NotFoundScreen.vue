<script setup lang="ts">
const homeUrl = import.meta.env.BASE_URL
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-12">
    <section role="alert" class="panel grid justify-items-start gap-4 p-8">
      <h1 class="font-display text-4xl leading-tight font-extrabold text-bad">This quiz couldn't be found</h1>
      <p class="text-xl">Please check the link, or choose a quiz from the list.</p>
      <a :href="homeUrl" class="btn btn-primary mt-2 text-xl">All Quizzes</a>
    </section>
  </main>
</template>
