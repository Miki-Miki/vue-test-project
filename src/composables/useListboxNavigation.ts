import { ref, watch, type ComputedRef, type Ref } from 'vue'

/**
 * Generic arrow-key/enter/escape navigation for a listbox-style dropdown
 * (e.g. autocomplete suggestions). Has no knowledge of what `items` are or
 * where they come from — any component rendering a filtered, selectable
 * list can drive it from an `<input>`'s keydown handler.
 */
export function useListboxNavigation<T>(
  items: Ref<T[]> | ComputedRef<T[]>,
  onSelect: (item: T) => void | Promise<void>,
) {
  const isOpen = ref(false)
  const highlightedIndex = ref(-1)

  watch(items, () => {
    highlightedIndex.value = -1
  })

  function open(): void {
    isOpen.value = true
  }

  function close(): void {
    isOpen.value = false
    highlightedIndex.value = -1
  }

  async function select(item: T): Promise<void> {
    close()
    await onSelect(item)
  }

  /**
   * `onFallbackEnter` runs when Enter is pressed with no item highlighted
   * (dropdown closed, or open with nothing selected) — e.g. submitting the
   * underlying input's own action instead of picking a suggestion.
   */
  async function onKeydown(event: KeyboardEvent, onFallbackEnter?: () => void | Promise<void>): Promise<void> {
    const hasItems = isOpen.value && items.value.length > 0

    if (event.key === 'ArrowDown' && hasItems) {
      event.preventDefault()
      highlightedIndex.value = (highlightedIndex.value + 1) % items.value.length
    } else if (event.key === 'ArrowUp' && hasItems) {
      event.preventDefault()
      highlightedIndex.value = highlightedIndex.value <= 0 ? items.value.length - 1 : highlightedIndex.value - 1
    } else if (event.key === 'Escape') {
      close()
    } else if (event.key === 'Enter') {
      if (hasItems && highlightedIndex.value >= 0) {
        event.preventDefault()
        await select(items.value[highlightedIndex.value]!)
      } else {
        close()
        await onFallbackEnter?.()
      }
    }
  }

  return { isOpen, highlightedIndex, open, close, select, onKeydown }
}
