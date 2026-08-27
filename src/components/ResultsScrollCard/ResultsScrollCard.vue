<script setup lang="ts">
import { computed } from 'vue'
import type { SearchResult } from '@/types/search'
import { RESULT_TABLE_HEADERS, joinArrayField } from '@/utils/resultTable'

const MAX_VISIBLE_TAGS = 4

const props = defineProps<{
  class?: string
  query: string
  results: SearchResult[]
  expanded?: boolean
}>()

const emit = defineEmits<{
  select: [result: SearchResult]
  expandToggle: []
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

function handleExpandToggle() {
  emit('expandToggle')
}

function rowProps({ item }: { item: SearchResult }) {
  return { onClick: () => emit('select', item) }
}
</script>

<template>
  <div :class="['results-scroll-card', props.class]">
    <header class="results-scroll-card-header">
      <span class="results-scroll-card-header-query">{{ query }}</span>
      <span class="results-scroll-card-header-count">{{ results.length }} results</span>
      <button
        type="button"
        class="btn results-scroll-card-header-expand-toggle"
        :aria-expanded="expanded ?? false"
        :aria-label="expanded ? 'Collapse' : 'Expand'"
        @click="handleExpandToggle"
      >
        {{ expanded ? '⤡' : '⤢' }}
      </button>
    </header>

    <v-data-table
      v-if="expanded"
      class="results-scroll-card-table"
      :items="results"
      :headers="RESULT_TABLE_HEADERS"
      :row-props="rowProps"
      item-value="id"
      density="compact"
    >
      <template #[`item.genre`]="{ value }">{{ joinArrayField(value) }}</template>
      <template #[`item.style`]="{ value }">{{ joinArrayField(value) }}</template>
    </v-data-table>

    <div v-else class="results-scroll-card-summary">
      <div v-if="visibleTags.length" class="results-scroll-card-summary-tags">
        <span
          v-for="tag in visibleTags"
          :key="tag"
          class="results-scroll-card-summary-tags-tag"
          >{{ tag }}</span
        >
        <span v-if="hiddenTagCount > 0" class="results-scroll-card-summary-tags-more">…</span>
      </div>
    </div>
  </div>
</template>

<style scoped src="./ResultsScrollCard.scss" lang="scss"></style>
