<script setup lang="ts">
import type { SearchSuggestion } from '@/types/search'
import { formatCommand } from '@/utils/searchCommand'

const props = defineProps<{
  suggestion: SearchSuggestion
}>()

const emit = defineEmits<{
  hoverChange: [hovering: boolean]
  select: []
}>()

function handleMouseEnter() {
  emit('hoverChange', true)
}

function handleMouseLeave() {
  emit('hoverChange', false)
}

function handleSuggestionClick() {
  emit('select')
}
</script>

<template>
  <button
    type="button"
    class="suggestion-node"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @click="handleSuggestionClick"
  >
    <span class="suggestion-node-label">{{ formatCommand(props.suggestion.mode, props.suggestion.value) }}</span>
  </button>
</template>

<style scoped src="./SuggestionNode.scss" lang="scss"></style>
