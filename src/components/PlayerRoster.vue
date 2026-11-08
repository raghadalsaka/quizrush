<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { MAX_PLAYERS } from '../config'
import type { RosterEntry } from '../types/game'
import { buildRoster, parseRosterNames } from '../utils/roster'
import { rosterKey } from '../utils/setupRules'
import EmojiSelect from './EmojiSelect.vue'

const roster = defineModel<RosterEntry[]>({ required: true })

const namesText = ref(roster.value.map((entry) => entry.name).join('\n'))
// Keyed by name rather than line, so a pick stays with its player when lines are added or reordered.
const picked = ref<Record<string, string>>(Object.fromEntries(roster.value.map((entry) => [rosterKey(entry.name), entry.emoji])))

const entries = computed<RosterEntry[]>(() => {
  const names = parseRosterNames(namesText.value)
  return buildRoster(
    names,
    names.map((name) => picked.value[rosterKey(name)] ?? null),
  )
})

watch(
  entries,
  (value) => {
    roster.value = value
  },
  { immediate: true },
)
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2 lg:gap-6">
    <div class="grid content-start gap-1">
      <label for="player-names" class="text-lg font-bold">Player names, one per line</label>
      <textarea
        id="player-names"
        v-model="namesText"
        class="field-input h-64 resize-none lg:h-72"
        autocomplete="off"
        spellcheck="false"
        aria-describedby="player-count"
      ></textarea>
      <p id="player-count" class="text-base text-ink-soft">{{ entries.length }} of {{ MAX_PLAYERS }} players. Turns follow this order.</p>
    </div>
    <div class="grid content-start gap-1">
      <p id="player-emojis-label" class="text-lg font-bold">Emojis</p>
      <p v-if="entries.length === 0" class="text-base text-ink-soft">Each player gets an emoji once their name is entered.</p>
      <ol v-else class="grid content-start gap-2 lg:h-72 lg:overflow-y-auto lg:pr-2" aria-labelledby="player-emojis-label">
        <li v-for="(entry, index) in entries" :key="index" class="flex items-center gap-3">
          <span class="w-7 shrink-0 text-right font-display text-lg font-bold text-ink-soft tabular-nums" aria-hidden="true">{{ index + 1 }}</span>
          <EmojiSelect
            :model-value="entry.emoji"
            :label="`Emoji for ${entry.name}`"
            @update:model-value="picked[rosterKey(entry.name)] = $event"
          />
          <span class="min-w-0 text-lg font-semibold break-words">{{ entry.name }}</span>
        </li>
      </ol>
    </div>
  </div>
</template>
