import { ref } from 'vue'
import type { SearchResult } from '@/types/search'

const selectedResult = ref<SearchResult | null>(null)

export function useDetailPanel() {
  function open(result: SearchResult) {
    selectedResult.value = result
  }

  function close() {
    selectedResult.value = null
  }

  function toggle(result: SearchResult) {
    selectedResult.value = selectedResult.value?.id === result.id ? null : result
  }

  return { selectedResult, open, close, toggle }
}
