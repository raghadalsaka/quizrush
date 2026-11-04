<script setup lang="ts">
import { computed } from 'vue'
import type { CatalogEntry } from '../types/contest'
import { groupByCategory } from '../utils/contestCatalog'
import CreatorCredit from './CreatorCredit.vue'

const props = defineProps<{
  entries: readonly CatalogEntry[]
}>()

const baseUrl = import.meta.env.BASE_URL
const groups = computed(() => groupByCategory(props.entries))
</script>

<template>
  <main class="mx-auto grid max-w-6xl select-none gap-8 px-4 py-8 lg:min-h-dvh lg:content-center lg:gap-6 lg:py-6">
    <header>
      <h1 class="font-display text-5xl leading-none font-extrabold tracking-tight lg:text-6xl">Quizrush</h1>
      <div class="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p class="text-xl text-ink-soft">Choose a quiz to play.</p>
        <CreatorCredit />
      </div>
    </header>

    <nav aria-label="Quizzes" class="panel p-6 lg:p-8">
      <div class="grid gap-6 lg:max-h-[28rem] lg:overflow-y-auto">
        <section v-for="group in groups" :key="group.category" class="grid gap-3">
          <h2 class="px-1 font-display text-3xl leading-tight font-extrabold">{{ group.category }}</h2>
          <ul class="grid gap-5 px-1 pb-2 sm:grid-cols-2 lg:grid-cols-3">
            <li v-for="entry in group.entries" :key="entry.slug" class="grid">
              <a :href="`${baseUrl}${entry.slug}/`" class="btn btn-large px-6 text-center">{{ entry.title }}</a>
            </li>
          </ul>
        </section>
      </div>
    </nav>
  </main>
</template>
