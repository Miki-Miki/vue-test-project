<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import SearchSessionsSidebar from '@/components/SearchSessionsSidebar/SearchSessionsSidebar.vue'
import SearchBar from '@/components/SearchBar/SearchBar.vue'
import DetailPanel from '@/components/DetailPanel/DetailPanel.vue'
import { useDetailPanel } from '@/composables/useDetailPanel'
import { useSearchQuery } from '@/composables/useSearchQuery'
import type { SearchMode } from '@/types/search'

const { selectedResult, close } = useDetailPanel()
const { searchByCommand } = useSearchQuery()

const isDark = ref(false)

onMounted(() => {
  isDark.value =
    document.documentElement.getAttribute('data-theme') === 'dark' ||
    (!document.documentElement.hasAttribute('data-theme') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
})

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')
}

function onCommandSelect(mode: SearchMode, value: string) {
  close()
  void searchByCommand(mode, value)
}
</script>

<template class="app">
  <div class="app-content">
    <div class="app-nav-wrapper">
      <nav class="app-nav">
        <div class="app-nav-links">
          <RouterLink to="/" class="app-nav-links-link">Search</RouterLink>
          <RouterLink to="/grid" class="app-nav-links-link">Grid</RouterLink>
          <RouterLink to="/tree" class="app-nav-links-link">Tree</RouterLink>
        </div>
        <button
          class="app-nav-theme-toggle"
          :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="toggleTheme"
        >
          <svg
            v-if="isDark"
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path
              d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
            />
          </svg>
          <svg
            v-else
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </button>
      </nav>

      <SearchBar />
    </div>

    <div class="app-body">
      <SearchSessionsSidebar />
      <RouterView />
    </div>
  </div>

  <DetailPanel
    v-if="selectedResult"
    :result="selectedResult"
    @close="close"
    @command-select="onCommandSelect"
  />
</template>

<style scoped src="./App.scss" lang="scss"></style>
