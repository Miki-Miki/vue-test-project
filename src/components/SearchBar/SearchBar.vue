<script setup lang="ts">
import { computed } from 'vue'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { useListboxNavigation } from '@/composables/useListboxNavigation'
import { SEARCH_COMMANDS } from '@/utils/searchCommand'

const { authenticated } = useDiscogsAuth()
const { query, loading, error, search, suggestions, selectSuggestion } = useSearchQuery()

const placeholder = computed(
  () => `Search artists, releases, labels… or ${SEARCH_COMMANDS.map((c) => c.example).join(', ')}`,
)

const { isOpen, highlightedIndex, open, close, select, onKeydown } = useListboxNavigation(
  suggestions,
  selectSuggestion,
)

async function onSearchClick(): Promise<void> {
  close()
  await search()
}

function handleKeydown(event: KeyboardEvent): Promise<void> {
  return onKeydown(event, search)
}
</script>

<template>
  <div class="search-bar">
    <div class="search-bar-controls">
      <input
        v-model="query"
        class="search-bar-controls-input"
        type="text"
        :placeholder="placeholder"
        :disabled="!authenticated || loading"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="isOpen && suggestions.length > 0"
        @input="open"
        @keydown="handleKeydown"
        @blur="close"
      />
      <button class="search-bar-controls-button" :disabled="!authenticated || loading" @click="onSearchClick">
        {{ loading ? '…' : 'Search' }}
      </button>
      <ul v-if="isOpen && suggestions.length > 0" class="search-bar-suggestions" role="listbox">
        <li
          v-for="(suggestion, index) in suggestions"
          :key="suggestion"
          class="search-bar-suggestions-item"
          :class="{ 'search-bar-suggestions-item-active': index === highlightedIndex }"
          role="option"
          :aria-selected="index === highlightedIndex"
          @mousedown.prevent="select(suggestion)"
        >
          {{ suggestion }}
        </li>
      </ul>
    </div>
    <p v-if="error" class="search-bar-error">{{ error }}</p>
  </div>
</template>

<style scoped src="./SearchBar.scss" lang="scss"></style>
