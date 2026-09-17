import { onMounted, onUnmounted, ref } from 'vue'
import type { Ref } from 'vue'

export function useElementSize(target: Ref<HTMLElement | null>) {
  const size = ref({ width: 0, height: 0 })
  let observer: ResizeObserver | undefined

  onMounted(() => {
    if (!target.value) return
    observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      size.value = { width: entry.contentRect.width, height: entry.contentRect.height }
    })
    observer.observe(target.value)
  })

  onUnmounted(() => observer?.disconnect())

  return size
}
