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
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <span v-if="!collapsed" class="sidebar-title">History</span>
      <button
        class="collapse-btn"
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

    <div v-if="!collapsed" class="sidebar-body">
      <p v-if="historyStore.entries.length === 0" class="empty-state">No searches yet</p>

      <ul v-else class="entry-list">
        <li
          v-for="entry in historyStore.entries"
          :key="entry.id"
          class="entry"
          :class="{ active: historyStore.activeEntryId === entry.id }"
          role="button"
          tabindex="0"
          @click="historyStore.setActiveEntry(entry.id)"
          @keyup.enter="historyStore.setActiveEntry(entry.id)"
        >
          <span class="entry-query">{{ entry.query }}</span>
          <div class="entry-meta">
            <span class="entry-count">{{ entry.results.length }} results</span>
            <span class="entry-time">{{ formatTime(entry.timestamp) }}</span>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="!collapsed && historyStore.entries.length > 0" class="sidebar-footer">
      <button class="clear-btn" @click="historyStore.clearHistory()">Clear history</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 220px;
  border-right: 1px solid var(--color-border);
  background: var(--color-surface-muted);
  overflow: hidden;
  transition: width 150ms;
}

.sidebar.collapsed {
  width: 36px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 var(--space-2);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
}

.sidebar-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition:
    background 150ms,
    color 150ms;
}

.collapse-btn:hover {
  background: var(--color-surface-active);
  color: var(--color-text);
}

.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-1) 0;
}

.empty-state {
  padding: var(--space-3) var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-subtle);
}

.entry-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.entry {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-2) var(--space-3);
  border-left: 2px solid transparent;
  cursor: pointer;
  transition:
    background 150ms,
    border-color 150ms;
}

.entry:hover {
  background: var(--color-surface-hover);
}

.entry.active {
  border-left-color: var(--accent);
  background: var(--color-surface-hover);
}

.entry-query {
  font-size: var(--font-size-base);
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.entry-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.entry-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.entry-time {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.sidebar-footer {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-border);
}

.clear-btn {
  width: 100%;
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  font-family: var(--font-family);
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    background 150ms,
    color 150ms,
    border-color 150ms;
}

.clear-btn:hover {
  background: var(--color-surface-active);
  color: var(--color-text);
  border-color: var(--color-border-strong);
}
</style>
