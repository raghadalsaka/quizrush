<script setup lang="ts">
import { computed } from 'vue'
import { isPhotoUrl } from '../utils/roster'

type BadgeSize = 'sm' | 'md' | 'lg'

const SIZES: Record<BadgeSize, string> = {
  sm: 'size-9 text-xl',
  md: 'size-12 text-3xl',
  lg: 'size-14 text-4xl',
}

const props = defineProps<{
  emoji: string
  photo?: string
  size: BadgeSize
}>()

// Checked where it is drawn, so no roster source can put a link or an SVG into the page.
const shownPhoto = computed(() => (props.photo !== undefined && isPhotoUrl(props.photo) ? props.photo : null))
</script>

<template>
  <span
    class="grid shrink-0 place-items-center rounded-full border-3 border-(--team) bg-card leading-none"
    :class="[SIZES[size], shownPhoto !== null ? 'overflow-hidden' : '']"
    aria-hidden="true"
  >
    <img v-if="shownPhoto !== null" :src="shownPhoto" alt="" class="size-full object-cover" draggable="false" />
    <template v-else>{{ emoji }}</template>
  </span>
</template>
