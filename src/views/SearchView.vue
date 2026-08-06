<script setup lang="ts">
import { computed } from 'vue'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import DiscogsAuthPrompt from '@/components/DiscogsAuthPrompt.vue'
import { useDiscogsStore } from '@/stores/discogs'

const { authenticated } = useDiscogsAuth()
const store = useDiscogsStore()

const displayJson = computed(() =>
  store.results.length ? JSON.stringify(store.results, null, 2) : '',
)
</script>

<template>
  <div class="search-view">
    <DiscogsAuthPrompt v-if="!authenticated" />

    <template v-else>
      <div class="results-area">
        <pre v-if="displayJson">{{ displayJson }}</pre>
        <p v-else class="placeholder">Search for artists, releases, labels…</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.results-area {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1.5rem 0;
}

pre {
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  font-size: var(--font-size-base);
}

.placeholder {
  color: var(--color-text-muted);
  font-size: var(--font-size-md);
}
</style>
