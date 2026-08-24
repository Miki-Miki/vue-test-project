<script setup lang="ts">
import { computed } from 'vue'
import { useDiscogsAuth } from '@/composables/useDiscogsAuth'
import AuthPrompt from '@/components/AuthPrompt/AuthPrompt.vue'
import { useDiscogsStore } from '@/stores/discogs'

const { authenticated } = useDiscogsAuth()
const store = useDiscogsStore()

const displayJson = computed(() =>
  store.results.length ? JSON.stringify(store.results, null, 2) : '',
)
</script>

<template>
  <div class="search-view">
    <AuthPrompt v-if="!authenticated" />

    <template v-else>
      <div class="search-view-results">
        <pre v-if="displayJson" class="search-view-results-output">{{ displayJson }}</pre>
        <p v-else class="search-view-results-placeholder">Search for artists, releases, labels…</p>
      </div>
    </template>
  </div>
</template>

<style scoped src="./SearchView.scss" lang="scss"></style>
