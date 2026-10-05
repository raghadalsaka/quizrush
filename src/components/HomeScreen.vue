<script setup lang="ts">
import type { CatalogEntry } from '../types/contest'

defineProps<{
  entries: readonly CatalogEntry[]
}>()

const baseUrl = import.meta.env.BASE_URL
</script>

<template>
  <main class="mx-auto grid max-w-6xl select-none gap-8 px-4 py-8 lg:min-h-dvh lg:content-center lg:gap-6 lg:py-6">
    <header>
      <h1 class="font-display text-5xl leading-none font-extrabold tracking-tight lg:text-6xl">Quizrush</h1>
      <p class="mt-3 text-xl text-ink-soft">Choose a quiz to play.</p>
    </header>

    <nav aria-label="Quizzes" class="panel p-6 lg:p-8">
      <ul class="grid gap-5 px-1 pb-2 sm:grid-cols-2 lg:max-h-[28rem] lg:grid-cols-3 lg:overflow-y-auto">
        <li v-for="entry in entries" :key="entry.slug" class="grid">
          <a :href="`${baseUrl}${entry.slug}/`" class="btn btn-large px-6 text-center">{{ entry.title }}</a>
        </li>
      </ul>
    </nav>
  </main>
</template>
