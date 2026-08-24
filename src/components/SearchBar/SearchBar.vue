<script setup lang="ts">
import { ref } from 'vue'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import { useDiscogsStore } from '@/stores/discogs'
import { useSearchHistoryStore } from '@/stores/searchHistory'

const { authenticated } = useDiscogsAuth()
const store = useDiscogsStore()
const historyStore = useSearchHistoryStore()

const query = ref('')
const loading = ref(false)
const error = ref('')

async function search() {
  if (!query.value.trim()) return

  loading.value = true
  error.value = ''

  try {
    const url = `/api/discogs/database/search?track=${encodeURIComponent(query.value)}`
    const response = await fetch(url)
    const data = await response.json()

    if (response.ok) {
      store.setResults(data)
      store.setQuery(query.value)
      historyStore.addEntry(query.value, data)
    } else {
      error.value = `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="search-bar">
    <div class="search-bar-controls">
      <input
        v-model="query"
        class="search-bar-controls-input"
        type="text"
        placeholder="Search artists, releases, labels…"
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
