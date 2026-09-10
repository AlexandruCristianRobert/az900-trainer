<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { useProgressStore } from '@/stores/progress'

const progress = useProgressStore()

/** Matches ExamView's two-step confirm: armed for 5s, then it disarms itself. */
const CONFIRM_WINDOW_MS = 5000
/**
 * A double-click lands its second click on whatever now occupies those pixels —
 * and Vue swaps the confirm button in on a microtask, long before the ~100-200ms
 * second click arrives. Clicks this soon after arming are the tail of a
 * double-click, never a deliberate confirmation, so the guard drops them.
 */
const CONFIRM_GRACE_MS = 400

const fileInput = ref<HTMLInputElement | null>(null)
const importFailed = ref(false)
const confirmingReset = ref(false)
let armedAtMs = 0
let confirmTimeoutId: ReturnType<typeof setTimeout> | undefined

onBeforeUnmount(() => clearTimeout(confirmTimeoutId))

function onExport(): void {
  const blob = new Blob([progress.exportProgress()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'az900-trainer-progress.json'
  // In the document and revoked a turn later: some browsers ignore a detached
  // link, and revoking synchronously can cancel the download it just started.
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function pickFile(): void {
  importFailed.value = false
  fileInput.value?.click()
}

async function onFileChosen(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await progress.importProgress(await file.text())
    importFailed.value = false
    disarmReset()
  } catch {
    // No alert(): a bad file reports itself in place, next to the control.
    importFailed.value = true
  } finally {
    // Clear the picker so re-choosing the same (fixed) file still fires a change.
    input.value = ''
  }
}

function disarmReset(): void {
  clearTimeout(confirmTimeoutId)
  confirmTimeoutId = undefined
  confirmingReset.value = false
}

function armReset(): void {
  clearTimeout(confirmTimeoutId)
  confirmingReset.value = true
  armedAtMs = Date.now()
  confirmTimeoutId = setTimeout(disarmReset, CONFIRM_WINDOW_MS)
}

async function confirmReset(): Promise<void> {
  if (Date.now() - armedAtMs < CONFIRM_GRACE_MS) return
  disarmReset()
  await progress.resetProgress()
  importFailed.value = false
}
</script>

<template>
  <section class="data">
    <p class="data__lede">Everything you answer stays in this browser.</p>
    <div class="data__actions">
      <button class="btn btn-ghost btn-small" type="button" @click="onExport">Export progress</button>
      <button class="btn btn-ghost btn-small" type="button" @click="pickFile">Import progress</button>
      <button v-if="!confirmingReset" class="btn btn-ghost btn-small data__reset" type="button" @click="armReset">
        Reset all progress
      </button>
      <button v-else class="btn btn-small data__reset--armed" type="button" @click="confirmReset">
        Confirm reset — this deletes all sessions and answers
      </button>
    </div>
    <input ref="fileInput" class="visually-hidden" type="file" accept=".json,application/json" @change="onFileChosen" />
    <p v-if="importFailed" class="data__error">That file isn't a valid progress export.</p>
  </section>
</template>

<style scoped>
.data {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.data__lede {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
}
.data__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.data__reset:hover {
  border-color: var(--fail);
  color: var(--fail);
}
.data__reset--armed {
  background: var(--fail);
  color: var(--fail-ink);
}
.data__error {
  flex-basis: 100%;
  margin: 0;
  color: var(--fail);
  font-size: 13px;
}
</style>
