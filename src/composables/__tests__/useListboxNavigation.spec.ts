import { ref } from 'vue'
import { useListboxNavigation } from '@/composables/useListboxNavigation'

function keydown(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true })
}

describe('useListboxNavigation', () => {
  it('starts closed with no highlight', () => {
    const items = ref(['a', 'b', 'c'])
    const { isOpen, highlightedIndex } = useListboxNavigation(items, jest.fn())

    expect(isOpen.value).toBe(false)
    expect(highlightedIndex.value).toBe(-1)
  })

  it('open/close toggle isOpen and close resets the highlight', () => {
    const items = ref(['a', 'b'])
    const { isOpen, highlightedIndex, open, close } = useListboxNavigation(items, jest.fn())

    open()
    expect(isOpen.value).toBe(true)

    highlightedIndex.value = 1
    close()
    expect(isOpen.value).toBe(false)
    expect(highlightedIndex.value).toBe(-1)
  })

  it('ArrowDown/ArrowUp move the highlight and wrap around', async () => {
    const items = ref(['a', 'b', 'c'])
    const { highlightedIndex, open, handleKeydown } = useListboxNavigation(items, jest.fn())
    open()

    await handleKeydown(keydown('ArrowDown'))
    expect(highlightedIndex.value).toBe(0)
    await handleKeydown(keydown('ArrowDown'))
    await handleKeydown(keydown('ArrowDown'))
    expect(highlightedIndex.value).toBe(2)
    await handleKeydown(keydown('ArrowDown'))
    expect(highlightedIndex.value).toBe(0)

    await handleKeydown(keydown('ArrowUp'))
    expect(highlightedIndex.value).toBe(2)
  })

  it('ignores arrow keys while closed', async () => {
    const items = ref(['a', 'b'])
    const { highlightedIndex, handleKeydown } = useListboxNavigation(items, jest.fn())

    await handleKeydown(keydown('ArrowDown'))
    expect(highlightedIndex.value).toBe(-1)
  })

  it('Escape closes and resets the highlight', async () => {
    const items = ref(['a', 'b'])
    const { isOpen, highlightedIndex, open, handleKeydown } = useListboxNavigation(items, jest.fn())
    open()
    highlightedIndex.value = 1

    await handleKeydown(keydown('Escape'))
    expect(isOpen.value).toBe(false)
    expect(highlightedIndex.value).toBe(-1)
  })

  it('Enter with a highlighted item closes the list and calls onSelect with that item', async () => {
    const items = ref(['a', 'b', 'c'])
    const onSelect = jest.fn()
    const { isOpen, open, highlightedIndex, handleKeydown } = useListboxNavigation(items, onSelect)
    open()
    highlightedIndex.value = 1

    await handleKeydown(keydown('Enter'))
    expect(onSelect).toHaveBeenCalledWith('b')
    expect(isOpen.value).toBe(false)
  })

  it('Enter with no highlight closes the list and calls the fallback instead of onSelect', async () => {
    const items = ref(['a', 'b'])
    const onSelect = jest.fn()
    const onFallbackEnter = jest.fn()
    const { isOpen, open, handleKeydown } = useListboxNavigation(items, onSelect)
    open()

    await handleKeydown(keydown('Enter'), onFallbackEnter)
    expect(onSelect).not.toHaveBeenCalled()
    expect(onFallbackEnter).toHaveBeenCalledTimes(1)
    expect(isOpen.value).toBe(false)
  })

  it('select() closes the list and calls onSelect directly', async () => {
    const items = ref(['a', 'b'])
    const onSelect = jest.fn()
    const { isOpen, open, select } = useListboxNavigation(items, onSelect)
    open()

    await select('b')
    expect(onSelect).toHaveBeenCalledWith('b')
    expect(isOpen.value).toBe(false)
  })

  it('resets the highlight when the items list changes', async () => {
    const items = ref(['a', 'b', 'c'])
    const { highlightedIndex, open, handleKeydown } = useListboxNavigation(items, jest.fn())
    open()
    await handleKeydown(keydown('ArrowDown'))
    expect(highlightedIndex.value).toBe(0)

    items.value = ['x', 'y']
    await Promise.resolve()

    expect(highlightedIndex.value).toBe(-1)
  })
})
