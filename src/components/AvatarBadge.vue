<script setup lang="ts">
type BadgeSize = 'sm' | 'md' | 'lg'

const SIZES: Record<BadgeSize, string> = {
  sm: 'size-9 text-xl',
  md: 'size-12 text-3xl',
  lg: 'size-14 text-4xl',
}

defineProps<{
  emoji: string
  size: BadgeSize
}>()
</script>

<template>
  <span
    class="grid shrink-0 place-items-center rounded-full border-3 border-(--team) bg-card leading-none"
    :class="SIZES[size]"
    aria-hidden="true"
  >
    {{ emoji }}
  </span>
</template>
