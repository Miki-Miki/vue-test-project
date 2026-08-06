<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import SearchHistorySidebar from '@/components/SearchHistorySidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

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
</script>

<template>
  <nav>
    <div class="nav-links">
      <RouterLink to="/">Search</RouterLink>
      <RouterLink to="/grid">Grid</RouterLink>
    </div>
    <button
      class="theme-toggle"
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

  <div class="app-body">
    <SearchHistorySidebar />
    <RouterView />
  </div>
</template>

<style scoped>
.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

nav {
  display: flex;
  flex-shrink: 0;
  height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-links a {
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: color 150ms;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: var(--color-text);
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition:
    background 150ms,
    color 150ms;
}

.theme-toggle:hover {
  background: var(--color-surface-hover);
  color: var(--color-text);
}
</style>
