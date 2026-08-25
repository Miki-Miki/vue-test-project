import { ref } from 'vue'
import { SearchMode } from '@/types/search'
import { useDiscogsStore } from '@/stores/discogs'
import { useSearchHistoryStore } from '@/stores/searchHistory'
import { discogsSearchApi } from '@/api/discogs'
import { parseSearchCommand, formatCommand, SEARCH_COMMANDS } from '@/utils/searchCommand'

const query = ref('')
const loading = ref(false)
const error = ref('')

function usageMessage(mode: SearchMode): string {
  const command = SEARCH_COMMANDS.find((c) => c.mode === mode)
  return command ? `Usage: ${command.keyword} <${command.label.toLowerCase()}> (e.g. ${command.example})` : ''
}

async function search(): Promise<void> {
  const parsed = parseSearchCommand(query.value)

  if (!parsed.term) {
    if (parsed.mode !== SearchMode.Track && parsed.raw) {
      error.value = usageMessage(parsed.mode)
    }
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await discogsSearchApi[parsed.mode](parsed.term)

    if (response.ok) {
      const store = useDiscogsStore()
      const historyStore = useSearchHistoryStore()
      store.setResults(response.data)
      store.setQuery(parsed.raw, parsed.mode)
      historyStore.addEntry(parsed.raw, response.data)
    } else {
      error.value = `HTTP ${response.status}: ${response.statusText}`
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'An unknown error occurred'
  } finally {
    loading.value = false
  }
}

async function searchByCommand(mode: SearchMode, value: string): Promise<void> {
  query.value = formatCommand(mode, value)
  await search()
}

function reset(): void {
  query.value = ''
  loading.value = false
  error.value = ''
}

export function useSearchQuery() {
  return { query, loading, error, search, searchByCommand, reset }
}
