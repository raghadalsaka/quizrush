<script setup lang="ts">
import { computed, onMounted } from 'vue'
import type { ClassRoster, ClassRosterStatus } from '../composables/useClassRoster'
import { teamThemeClass } from '../utils/teamTheme'
import AvatarBadge from './AvatarBadge.vue'

const STATUS_TEXT: Record<ClassRosterStatus, string> = {
  disconnected: '',
  connecting: 'Waiting for Google…',
  'loading-classes': 'Loading the classes…',
  connected: '',
  'loading-class': 'Loading the class…',
}

const props = defineProps<{
  classRoster: ClassRoster
}>()

const { status, message, classes, selectedSlug, roster } = props.classRoster

const needsConnect = computed(() => status.value === 'disconnected' || status.value === 'connecting')

function onClassChange(event: Event): void {
  void props.classRoster.pickClass((event.target as HTMLSelectElement).value)
}

onMounted(() => {
  props.classRoster.preload()
})
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2 lg:gap-6">
    <div class="grid content-start gap-3">
      <button
        v-if="needsConnect"
        type="button"
        class="btn justify-self-start"
        :disabled="status === 'connecting'"
        @click="classRoster.connect"
      >
        Connect Google
      </button>
      <div v-else class="grid gap-1">
        <label for="class-choice" class="text-lg font-bold">Class</label>
        <select
          id="class-choice"
          class="field-input"
          :value="selectedSlug"
          :disabled="status === 'loading-classes'"
          @change="onClassChange"
        >
          <option value="">Choose a class</option>
          <option v-for="choice in classes" :key="choice.slug" :value="choice.slug">{{ choice.name }}</option>
        </select>
      </div>
      <p class="text-base text-ink-soft" role="status">{{ STATUS_TEXT[status] }}</p>
      <p v-if="message !== ''" class="text-base font-semibold text-bad" role="alert">{{ message }}</p>
      <p class="text-base text-ink-soft">To change a class, edit the spreadsheet. Changes show the next time the class is loaded.</p>
    </div>
    <div class="grid content-start gap-1">
      <p id="class-players-label" class="text-lg font-bold">Players</p>
      <p v-if="roster === null" class="text-base text-ink-soft">The class appears here once you pick it.</p>
      <p v-else-if="roster.length === 0" class="text-base text-ink-soft">This class has no students yet.</p>
      <template v-else>
        <ol class="grid content-start gap-2 lg:h-72 lg:overflow-y-auto lg:pr-2" aria-labelledby="class-players-label">
          <li v-for="(entry, index) in roster" :key="index" class="flex items-center gap-3" :class="teamThemeClass(index)">
            <span class="w-7 shrink-0 text-right font-display text-lg font-bold text-ink-soft tabular-nums" aria-hidden="true">{{ index + 1 }}</span>
            <AvatarBadge :emoji="entry.emoji" :photo="entry.photo" size="sm" />
            <span class="min-w-0 text-lg font-semibold break-words">{{ entry.name }}</span>
          </li>
        </ol>
        <p class="text-base text-ink-soft">{{ roster.length }} players. Turns follow this order.</p>
      </template>
    </div>
  </div>
</template>
