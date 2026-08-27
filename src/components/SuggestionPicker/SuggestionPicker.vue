<script setup lang="ts">
import type { SearchMode, SearchSuggestion } from '@/types/search'
import { formatCommand } from '@/utils/searchCommand'

defineProps<{
  suggestions: SearchSuggestion[]
  loading?: boolean
  error?: string
  class?: string
}>()

const emit = defineEmits<{
  select: [mode: SearchMode, value: string]
  retry: []
}>()

function handleSuggestionSelect(suggestion: SearchSuggestion) {
  emit('select', suggestion.mode, suggestion.value)
}

function handleRetrySuggestions() {
  emit('retry')
}
</script>

<template>
  <div :class="['suggestion-picker', $props.class]">
    <template v-if="loading">
      <span
        v-for="n in 3"
        :key="n"
        class="btn suggestion-picker-option suggestion-picker-option-skeleton"
      ></span>
    </template>

    <template v-else-if="error">
      <p class="suggestion-picker-error">{{ error }}</p>
      <button type="button" class="btn" @click="handleRetrySuggestions">Retry</button>
    </template>

    <template v-else>
      <button
        v-for="suggestion in suggestions"
        :key="`${suggestion.mode}-${suggestion.value}`"
        type="button"
        class="btn suggestion-picker-option"
        @click="handleSuggestionSelect(suggestion)"
      >
        {{ formatCommand(suggestion.mode, suggestion.value) }}
      </button>
    </template>
  </div>
</template>

<style scoped src="./SuggestionPicker.scss" lang="scss"></style>
