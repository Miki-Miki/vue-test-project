<script setup lang="ts">
import { computed } from 'vue'
import type { SearchResult } from '@/types/search'

const MAX_VISIBLE_TAGS = 4

const props = defineProps<{
  query: string
  results: SearchResult[]
}>()

const emit = defineEmits<{
  hoverChange: [hovering: boolean]
  dragStart: [event: PointerEvent]
}>()

const uniqueTags = computed(() => {
  const tags = new Set<string>()
  for (const result of props.results) {
    result.genre?.forEach((tag) => tags.add(tag))
    result.style?.forEach((tag) => tags.add(tag))
  }
  return Array.from(tags)
})

const visibleTags = computed(() => uniqueTags.value.slice(0, MAX_VISIBLE_TAGS))
const hiddenTagCount = computed(() => uniqueTags.value.length - visibleTags.value.length)

function handleMouseEnter() {
  emit('hoverChange', true)
}

function handleMouseLeave() {
  emit('hoverChange', false)
}

function handlePointerDown(event: PointerEvent) {
  event.preventDefault()
  emit('dragStart', event)
}
</script>

<template>
  <div
    class="results-node"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @pointerdown="handlePointerDown"
  >
    <header class="results-node-header">
      <span class="results-node-header-query">{{ query }}</span>
      <!-- <span class="results-node-header-count">{{ results.length }} results</span> -->
    </header>

    <div class="results-node-summary">
      <div v-if="visibleTags.length" class="results-node-summary-tags">
        <span v-for="tag in visibleTags" :key="tag" class="results-node-summary-tags-tag">{{
          tag
        }}</span>
        <span v-if="hiddenTagCount > 0" class="results-node-summary-tags-more">…</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="./ResultsNode.scss" lang="scss"></style>
