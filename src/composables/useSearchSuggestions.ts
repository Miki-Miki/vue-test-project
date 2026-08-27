import { ref } from 'vue'
import type { SearchSuggestion } from '@/types/search'
import { suggestNextSearches } from '@/api/discogs/suggestions'

const suggestions = ref<SearchSuggestion[]>([])
const loading = ref(false)
const error = ref('')

async function refresh(history: string[]): Promise<void> {
  loading.value = true
  error.value = ''

  try {
    suggestions.value = await suggestNextSearches(history)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Could not get suggestions'
    suggestions.value = []
  } finally {
    loading.value = false
  }
}

export function useSearchSuggestions() {
  return { suggestions, loading, error, refresh }
}
