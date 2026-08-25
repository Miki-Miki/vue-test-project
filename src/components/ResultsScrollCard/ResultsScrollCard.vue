<script setup lang="ts">
import type { SearchResult } from '@/types/search'

defineProps<{
  query: string
  results: SearchResult[]
}>()

const emit = defineEmits<{
  select: [result: SearchResult]
}>()

function onLoad({ done }: { done: (status: 'ok' | 'error' | 'empty' | 'loading') => void }) {
  done('empty')
}
</script>

<template>
  <div class="results-scroll-card">
    <header class="results-scroll-card-header">
      <span class="results-scroll-card-header-query">{{ query }}</span>
      <span class="results-scroll-card-header-count">{{ results.length }} results</span>
    </header>

    <v-infinite-scroll
      class="results-scroll-card-list"
      mode="manual"
      empty-text="End of results"
      @load="onLoad"
    >
      <div
        v-for="item in results"
        :key="item.id"
        class="results-scroll-card-list-item"
        role="button"
        tabindex="0"
        @click="emit('select', item)"
        @keyup.enter="emit('select', item)"
      >
        <span class="results-scroll-card-list-item-title">{{ item.title }}</span>
        <div v-if="item.genre?.length" class="results-scroll-card-list-item-genres">
          <span
            v-for="genre in item.genre"
            :key="genre"
            class="results-scroll-card-list-item-genres-tag"
            >{{ genre }}</span
          >
        </div>
      </div>
    </v-infinite-scroll>
  </div>
</template>

<style scoped src="./ResultsScrollCard.scss" lang="scss"></style>
