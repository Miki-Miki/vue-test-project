<script setup lang="ts">
import type { SearchSession } from '@/stores/searchHistory'
import ChevronIcon from '@/components/ChevronIcon/ChevronIcon.vue'

const props = defineProps<{
  session: SearchSession
  active: boolean
  expanded: boolean
  activeSearchId: string | null
}>()

const emit = defineEmits<{
  select: [session: SearchSession]
  'toggle-expand': [sessionId: string]
  'select-search': [sessionId: string, searchId: string]
}>()

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function lastSearch(session: SearchSession) {
  return session.searches[session.searches.length - 1]!
}

function handleSessionSelect(): void {
  emit('select', props.session)
}

function handleSessionExpandToggle(): void {
  emit('toggle-expand', props.session.id)
}

function handleSearchSelect(searchId: string): void {
  emit('select-search', props.session.id, searchId)
}
</script>

<template>
  <li
    class="session-list-item"
    :class="{ 'session-list-item-active': active }"
    role="button"
    tabindex="0"
    @click="handleSessionSelect"
    @keyup.enter="handleSessionSelect"
  >
    <div class="session-list-item-row">
      <button
        v-if="session.searches.length > 1"
        class="session-list-item-expand-btn"
        :class="{ 'session-list-item-expand-btn-expanded': expanded }"
        :aria-label="expanded ? 'Collapse session' : 'Expand session'"
        @click.stop="handleSessionExpandToggle"
      >
        <ChevronIcon :size="20" :rotation="expanded ? 90 : 0" />
      </button>
      <div class="session-list-item-content">
        <span class="session-list-item-query">{{ lastSearch(session).query }}</span>
        <div class="session-list-item-meta">
          <span class="session-list-item-meta-count"
            >{{ lastSearch(session).results.length }} results<template
              v-if="session.searches.length > 1"
            >
              &middot; &times;{{ session.searches.length }} searches</template
            ></span
          >
          <span class="session-list-item-meta-time">{{ formatTime(session.timestamp) }}</span>
        </div>
      </div>
    </div>

    <ul v-if="session.searches.length > 1 && expanded" class="session-list-item-searches">
      <li
        v-for="search in session.searches"
        :key="search.id"
        class="session-list-item-searches-search"
        :class="{
          'session-list-item-searches-search-active': active && activeSearchId === search.id,
        }"
        role="button"
        tabindex="0"
        @click.stop="handleSearchSelect(search.id)"
        @keyup.enter.stop="handleSearchSelect(search.id)"
      >
        <span class="session-list-item-searches-search-query">{{ search.query }}</span>
        <span class="session-list-item-searches-search-count"
          >{{ search.results.length }} results</span
        >
      </li>
    </ul>
  </li>
</template>

<style scoped src="./SessionListItem.scss" lang="scss"></style>
