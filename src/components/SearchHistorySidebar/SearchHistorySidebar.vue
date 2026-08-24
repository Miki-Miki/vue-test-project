<script setup lang="ts">
import { ref } from 'vue'
import { useSearchHistoryStore } from '@/stores/searchHistory'

const historyStore = useSearchHistoryStore()
const collapsed = ref(false)

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <aside class="search-history-sidebar" :class="{ 'search-history-sidebar-collapsed': collapsed }">
    <div class="search-history-sidebar-header">
      <span v-if="!collapsed" class="search-history-sidebar-header-title">History</span>
      <button
        class="search-history-sidebar-header-collapse-btn"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="collapsed = !collapsed"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          :style="{ transform: collapsed ? 'rotate(180deg)' : 'none' }"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </div>

    <div v-if="!collapsed" class="search-history-sidebar-body">
      <p v-if="historyStore.entries.length === 0" class="search-history-sidebar-body-empty">No searches yet</p>

      <ul v-else class="search-history-sidebar-body-entries">
        <li
          v-for="entry in historyStore.entries"
          :key="entry.id"
          class="search-history-sidebar-body-entries-entry"
          :class="{
            'search-history-sidebar-body-entries-entry-active': historyStore.activeEntryId === entry.id,
          }"
          role="button"
          tabindex="0"
          @click="historyStore.setActiveEntry(entry.id)"
          @keyup.enter="historyStore.setActiveEntry(entry.id)"
        >
          <span class="search-history-sidebar-body-entries-entry-query">{{ entry.query }}</span>
          <div class="search-history-sidebar-body-entries-entry-meta">
            <span class="search-history-sidebar-body-entries-entry-meta-count"
              >{{ entry.results.length }} results</span
            >
            <span class="search-history-sidebar-body-entries-entry-meta-time">{{
              formatTime(entry.timestamp)
            }}</span>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="!collapsed && historyStore.entries.length > 0" class="search-history-sidebar-footer">
      <button class="search-history-sidebar-footer-clear-btn" @click="historyStore.clearHistory()">
        Clear history
      </button>
    </div>
  </aside>
</template>

<style scoped src="./SearchHistorySidebar.scss" lang="scss"></style>
