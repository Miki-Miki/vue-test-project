import { mount } from '@vue/test-utils'
import DetailPanel from '@/components/DetailPanel/DetailPanel.vue'
import type { DiscogsResult } from '@/stores/discogs'

const baseResult: DiscogsResult = {
  id: 1,
  title: 'Nirvana - Nevermind',
  type: 'release',
  uri: '/Nirvana-Nevermind/release/1',
  resource_url: 'https://api.discogs.com/releases/1',
}

describe('DetailPanel', () => {
  it('renders the thumbnail image when result.thumb is set', () => {
    const wrapper = mount(DetailPanel, {
      props: { result: { ...baseResult, thumb: 'https://img/thumb.jpg' } },
    })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://img/thumb.jpg')
    expect(img.attributes('alt')).toBe(baseResult.title)
    expect(wrapper.find('.detail-panel-thumb-empty').exists()).toBe(false)
  })

  it('renders a placeholder when result.thumb is missing', () => {
    const wrapper = mount(DetailPanel, { props: { result: baseResult } })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.detail-panel-thumb-empty').exists()).toBe(true)
  })

  it('splits "Artist - Title" into separate artist and title', () => {
    const wrapper = mount(DetailPanel, { props: { result: baseResult } })
    expect(wrapper.find('.detail-panel-title').text()).toBe('Nevermind')
    expect(wrapper.find('.detail-panel-artist').text()).toBe('Nirvana')
  })

  it('renders the full title with no artist line when there is no " - " separator', () => {
    const wrapper = mount(DetailPanel, {
      props: { result: { ...baseResult, title: 'Nevermind' } },
    })
    expect(wrapper.find('.detail-panel-title').text()).toBe('Nevermind')
    expect(wrapper.find('.detail-panel-artist').exists()).toBe(false)
  })

  it('renders genre and style values as tags', () => {
    const wrapper = mount(DetailPanel, {
      props: { result: { ...baseResult, genre: ['Rock'], style: ['Grunge'] } },
    })
    const tags = wrapper.findAll('.detail-panel-tags-tag').map((tag) => tag.text())
    expect(tags).toEqual(['Rock', 'Grunge'])
  })

  it('renders no tags when genre and style are both missing', () => {
    const wrapper = mount(DetailPanel, { props: { result: baseResult } })
    expect(wrapper.findAll('.detail-panel-tags-tag')).toHaveLength(0)
  })

  it('joins populated format/label arrays with a comma', () => {
    const wrapper = mount(DetailPanel, {
      props: { result: { ...baseResult, format: ['CD', 'Album'], label: ['Sub Pop'] } },
    })
    expect(wrapper.text()).toContain('CD, Album')
    expect(wrapper.text()).toContain('Sub Pop')
  })

  it('renders an em-dash for missing/empty year, format, label, catno, and country', () => {
    const wrapper = mount(DetailPanel, {
      props: { result: { ...baseResult, format: [], label: undefined } },
    })
    const dds = wrapper.findAll('dd').map((dd) => dd.text())
    expect(dds).toEqual(['—', '—', '—', '—', '—'])
  })

  it('renders year, catno, and country when present', () => {
    const wrapper = mount(DetailPanel, {
      props: { result: { ...baseResult, year: '1991', catno: 'DGC-24425', country: 'US' } },
    })
    const dds = wrapper.findAll('dd').map((dd) => dd.text())
    expect(dds).toEqual(['1991', '—', '—', 'DGC-24425', 'US'])
  })

  it('links to the Discogs release page, resolving a relative uri against discogs.com', () => {
    const wrapper = mount(DetailPanel, { props: { result: baseResult } })
    const link = wrapper.find('a.btn')
    expect(link.attributes('href')).toBe('https://www.discogs.com/Nirvana-Nevermind/release/1')
  })

  it('uses an absolute uri as-is when it is already a full URL', () => {
    const wrapper = mount(DetailPanel, {
      props: { result: { ...baseResult, uri: 'https://www.discogs.com/release/1' } },
    })
    const link = wrapper.find('a.btn')
    expect(link.attributes('href')).toBe('https://www.discogs.com/release/1')
  })

  it('emits close when the close button is clicked', async () => {
    const wrapper = mount(DetailPanel, { props: { result: baseResult } })
    await wrapper.find('.detail-panel-close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('does not render an overlay, so underlying content stays clickable', () => {
    const wrapper = mount(DetailPanel, { props: { result: baseResult } })
    expect(wrapper.find('.detail-overlay').exists()).toBe(false)
  })
})
