import { useDetailPanel } from '@/composables/useDetailPanel'
import type { SearchResult } from '@/types/search'

const resultA: SearchResult = {
  id: 1,
  title: 'Nirvana - Nevermind',
  type: 'release',
  uri: '/Nirvana-Nevermind/release/1',
  resource_url: 'https://api.discogs.com/releases/1',
}

const resultB: SearchResult = {
  id: 2,
  title: 'Pink Floyd - The Wall',
  type: 'release',
  uri: '/Pink-Floyd-The-Wall/release/2',
  resource_url: 'https://api.discogs.com/releases/2',
}

describe('useDetailPanel', () => {
  afterEach(() => {
    useDetailPanel().close()
  })

  it('starts with no selected result', () => {
    expect(useDetailPanel().selectedResult.value).toBeNull()
  })

  it('open() sets the selected result', () => {
    useDetailPanel().open(resultA)
    expect(useDetailPanel().selectedResult.value).toEqual(resultA)
  })

  it('close() clears the selected result', () => {
    useDetailPanel().open(resultA)
    useDetailPanel().close()
    expect(useDetailPanel().selectedResult.value).toBeNull()
  })

  it('handleDetailPanelToggle() opens a result when nothing is selected', () => {
    useDetailPanel().handleDetailPanelToggle(resultA)
    expect(useDetailPanel().selectedResult.value).toEqual(resultA)
  })

  it('handleDetailPanelToggle() closes the panel when the same result is toggled again', () => {
    const { handleDetailPanelToggle } = useDetailPanel()
    handleDetailPanelToggle(resultA)
    handleDetailPanelToggle(resultA)
    expect(useDetailPanel().selectedResult.value).toBeNull()
  })

  it('handleDetailPanelToggle() switches to a different result without closing', () => {
    const { handleDetailPanelToggle } = useDetailPanel()
    handleDetailPanelToggle(resultA)
    handleDetailPanelToggle(resultB)
    expect(useDetailPanel().selectedResult.value).toEqual(resultB)
  })

  it('is a singleton — separate calls to useDetailPanel() share state', () => {
    useDetailPanel().open(resultA)
    expect(useDetailPanel().selectedResult.value).toEqual(resultA)
  })
})
