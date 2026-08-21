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
  <div class="search-bar-wrapper">
    <div class="search-bar">
      <input
        v-model="query"
        type="text"
        placeholder="Search artists, releases, labels…"
        :disabled="!authenticated || loading"
        @keyup.enter="search"
      />
      <button :disabled="!authenticated || loading" @click="search">
        {{ loading ? '…' : 'Search' }}
      </button>
    </div>
    <p v-if="error" class="search-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.search-bar-wrapper {
  flex-shrink: 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.search-bar {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
}

.search-error {
  margin: 0;
  padding: 0 var(--space-4) var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--status-danger-text);
}

input {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  font-size: var(--font-size-md);
  font-family: var(--font-family);
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 150ms;
}

input::placeholder {
  color: var(--color-text-subtle);
}

input:focus {
  border-color: var(--accent);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button {
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-md);
  font-family: var(--font-family);
  font-weight: 500;
  color: var(--color-text-inverted);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 150ms;
}

button:hover:not(:disabled) {
  background: var(--accent-dark);
  border-color: var(--accent-dark);
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
