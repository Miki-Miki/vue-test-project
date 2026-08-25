<script setup lang="ts">
import { computed } from 'vue'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import { useSearchQuery } from '@/composables/useSearchQuery'
import { SEARCH_COMMANDS } from '@/utils/searchCommand'

const { authenticated } = useDiscogsAuth()
const { query, loading, error, search } = useSearchQuery()

const placeholder = computed(
  () => `Search artists, releases, labels… or ${SEARCH_COMMANDS.map((c) => c.example).join(', ')}`,
)
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
        @keyup.enter="search"
      />
      <button class="search-bar-controls-button" :disabled="!authenticated || loading" @click="search">
        {{ loading ? '…' : 'Search' }}
      </button>
    </div>
    <p v-if="error" class="search-bar-error">{{ error }}</p>
  </div>
</template>

<style scoped src="./SearchBar.scss" lang="scss"></style>
