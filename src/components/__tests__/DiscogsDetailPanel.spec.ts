import { mount } from '@vue/test-utils'
import DiscogsDetailPanel from '@/components/DiscogsDetailPanel.vue'
import type { DiscogsResult } from '@/stores/discogs'

const baseResult: DiscogsResult = {
  id: 1,
  title: 'Nirvana - Nevermind',
  type: 'release',
  uri: '/Nirvana-Nevermind/release/1',
  resource_url: 'https://api.discogs.com/releases/1',
}

describe('DiscogsDetailPanel', () => {
  it('renders the thumbnail image when result.thumb is set', () => {
    const wrapper = mount(DiscogsDetailPanel, {
      props: { result: { ...baseResult, thumb: 'https://img/thumb.jpg' } },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://img/thumb.jpg')
    expect(img.attributes('alt')).toBe(baseResult.title)
    expect(wrapper.text()).not.toContain('No image available')
  })

  it('renders a placeholder when result.thumb is missing', () => {
    const wrapper = mount(DiscogsDetailPanel, { props: { result: baseResult } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('No image available')
  })

  it('joins populated format/label arrays with a comma', () => {
    const wrapper = mount(DiscogsDetailPanel, {
      props: { result: { ...baseResult, format: ['CD', 'Album'], label: ['Sub Pop'] } },
    })
    expect(wrapper.text()).toContain('CD, Album')
    expect(wrapper.text()).toContain('Sub Pop')
  })

  it('renders an em-dash for missing/empty format, label, catno, and community fields', () => {
    const wrapper = mount(DiscogsDetailPanel, {
      props: { result: { ...baseResult, format: [], label: undefined } },
    })
    const dds = wrapper.findAll('dd').map((dd) => dd.text())
    expect(dds).toEqual(['—', '—', '—', '—', '—'])
  })

  it('renders community want/have counts when present', () => {
    const wrapper = mount(DiscogsDetailPanel, {
      props: { result: { ...baseResult, catno: 'DGC-24425', community: { want: 100, have: 50 } } },
    })
    const dds = wrapper.findAll('dd').map((dd) => dd.text())
    expect(dds).toEqual(['—', '—', 'DGC-24425', '100', '50'])
  })
})
