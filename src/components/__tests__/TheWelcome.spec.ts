import { mount } from '@vue/test-utils'
import TheWelcome from '@/components/TheWelcome.vue'

describe('TheWelcome', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({})
  })

  it('opens the README in the editor when the link is clicked', async () => {
    const wrapper = mount(TheWelcome, {
      global: {
        stubs: {
          IconDocumentation: true,
          IconTooling: true,
          IconEcosystem: true,
          IconCommunity: true,
          IconSupport: true,
        },
      },
    })

    const editorLink = wrapper.findAll('a').find((a) => a.text().includes('README.md'))
    expect(editorLink).toBeDefined()

    await editorLink!.trigger('click')

    expect(global.fetch).toHaveBeenCalledWith('/__open-in-editor?file=README.md')
  })
})
