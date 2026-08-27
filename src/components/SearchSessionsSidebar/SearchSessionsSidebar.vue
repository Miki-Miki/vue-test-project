<script setup lang="ts">
import { ref } from 'vue'
import { useSearchHistoryStore, type SearchSession } from '@/stores/searchHistory'
import ChevronIcon from '@/components/ChevronIcon/ChevronIcon.vue'
import SessionListItem from './SessionListItem/SessionListItem.vue'

const historyStore = useSearchHistoryStore()
const collapsed = ref(false)
const expandedSessionIds = ref(new Set<string>())

function isSessionExpanded(sessionId: string): boolean {
  return expandedSessionIds.value.has(sessionId)
}

function handleSessionExpandToggle(sessionId: string): void {
  const next = new Set(expandedSessionIds.value)
  if (next.has(sessionId)) {
    next.delete(sessionId)
  } else {
    next.add(sessionId)
  }
  expandedSessionIds.value = next
}

function handleSessionSelect(session: SearchSession): void {
  historyStore.setActiveEntry(session.id)
}

function handleSearchSelect(sessionId: string, searchId: string): void {
  historyStore.setActiveEntry(sessionId, searchId)
}
</script>

<template>
  <aside class="search-sessions-sidebar" :class="{ 'search-sessions-sidebar-collapsed': collapsed }">
    <div class="search-sessions-sidebar-header">
      <span v-if="!collapsed" class="search-sessions-sidebar-header-title">Sessions</span>
      <button
        class="search-sessions-sidebar-header-new-session-btn"
        aria-label="New session"
        title="New session"
        @click="historyStore.startNewSession()"
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
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      <button
        class="search-sessions-sidebar-header-collapse-btn"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="collapsed = !collapsed"
      >
        <ChevronIcon :size="14" :rotation="collapsed ? 0 : 180" />
      </button>
    </div>

    <div v-if="!collapsed" class="search-sessions-sidebar-body">
      <p v-if="historyStore.sessions.length === 0" class="search-sessions-sidebar-body-empty">No searches yet</p>

      <ul v-else class="search-sessions-sidebar-body-entries">
        <SessionListItem
          v-for="session in historyStore.sessions"
          :key="session.id"
          :session="session"
          :active="historyStore.activeSessionId === session.id"
          :expanded="isSessionExpanded(session.id)"
          :active-search-id="historyStore.activeSearchId"
          @select="handleSessionSelect"
          @toggle-expand="handleSessionExpandToggle"
          @select-search="handleSearchSelect"
        />
      </ul>
    </div>

    <div v-if="!collapsed && historyStore.sessions.length > 0" class="search-sessions-sidebar-footer">
      <button class="search-sessions-sidebar-footer-clear-btn" @click="historyStore.clearHistory()">
        Clear history
      </button>
    </div>
  </aside>
</template>

<style scoped src="./SearchSessionsSidebar.scss" lang="scss"></style>
