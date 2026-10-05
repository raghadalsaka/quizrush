<script setup lang="ts">
import { contestCatalog } from 'virtual:contest-catalog'
import HomeScreen from './components/HomeScreen.vue'
import NotFoundScreen from './components/NotFoundScreen.vue'
import QuizApp from './components/QuizApp.vue'
import { slugFromPath } from './utils/contestCatalog'

const slug = slugFromPath(window.location.pathname, import.meta.env.BASE_URL)
const entry = contestCatalog.find((candidate) => candidate.slug === slug)
</script>

<template>
  <HomeScreen v-if="slug === ''" :entries="contestCatalog" />
  <QuizApp v-else-if="entry !== undefined" :entry="entry" />
  <NotFoundScreen v-else />
</template>
