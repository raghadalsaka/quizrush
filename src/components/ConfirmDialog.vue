<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    const element = dialog.value
    if (element === null) {
      return
    }
    if (open && !element.open) {
      element.showModal()
    } else if (!open && element.open) {
      element.close()
    }
  },
  { flush: 'post' },
)

function onCancel(event: Event): void {
  event.preventDefault()
  emit('cancel')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="panel m-auto w-[min(36rem,calc(100vw-2rem))] p-8 text-ink backdrop:bg-ink/55"
    aria-labelledby="confirm-dialog-title"
    aria-describedby="confirm-dialog-message"
    @cancel="onCancel"
  >
    <h2 id="confirm-dialog-title" class="font-display text-3xl leading-tight font-extrabold">{{ title }}</h2>
    <p id="confirm-dialog-message" class="mt-3 text-xl">{{ message }}</p>
    <div class="mt-8 flex flex-wrap justify-end gap-3">
      <button type="button" class="btn" autofocus @click="emit('cancel')">Cancel</button>
      <button type="button" class="btn btn-primary" @click="emit('confirm')">{{ confirmLabel }}</button>
    </div>
  </dialog>
</template>
