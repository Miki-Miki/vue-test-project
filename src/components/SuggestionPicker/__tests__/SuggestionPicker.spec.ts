import { mount } from '@vue/test-utils'
import SuggestionPicker from '@/components/SuggestionPicker/SuggestionPicker.vue'
import { SearchMode } from '@/types/search'
import type { SearchSuggestion } from '@/types/search'

const suggestions: SearchSuggestion[] = [
  { mode: SearchMode.Genre, value: 'Electronic' },
  { mode: SearchMode.Style, value: 'Tech House' },
]

describe('SuggestionPicker', () => {
  it('renders each suggestion as a formatted command button', () => {
    const wrapper = mount(SuggestionPicker, { props: { suggestions } })
    const buttons = wrapper.findAll('button.suggestion-picker-option')
    expect(buttons.map((b) => b.text())).toEqual(['/genre Electronic', '/style "Tech House"'])
  })

  it('emits select with the suggestion mode and value when a button is clicked', async () => {
    const wrapper = mount(SuggestionPicker, { props: { suggestions } })
    const buttons = wrapper.findAll('button.suggestion-picker-option')
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('select')).toEqual([[SearchMode.Style, 'Tech House']])
  })

  it('renders 3 disabled placeholder buttons while loading, with no real suggestions', () => {
    const wrapper = mount(SuggestionPicker, { props: { suggestions, loading: true } })
    expect(wrapper.findAll('.suggestion-picker-option-skeleton')).toHaveLength(3)
    expect(wrapper.text()).not.toContain('/genre Electronic')
  })

  it('renders an error message and a retry button instead of suggestions', async () => {
    const wrapper = mount(SuggestionPicker, {
      props: { suggestions, error: 'Could not get suggestions' },
    })
    expect(wrapper.find('.suggestion-picker-error').text()).toBe('Could not get suggestions')
    expect(wrapper.find('button.suggestion-picker-option').exists()).toBe(false)

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders no buttons when there are no suggestions and no loading/error state', () => {
    const wrapper = mount(SuggestionPicker, { props: { suggestions: [] } })
    expect(wrapper.findAll('button')).toHaveLength(0)
  })
})
