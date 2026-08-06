import { mount } from '@vue/test-utils'
import DiscogsAuthPrompt from '@/components/DiscogsAuthPrompt.vue'

const mockLogin = jest.fn()

jest.mock('@/composables/useDiscogsAuth', () => ({
  useDiscogsAuth: () => ({ login: mockLogin, logout: jest.fn(), authenticated: { value: false } }),
}))

describe('DiscogsAuthPrompt', () => {
  beforeEach(() => {
    mockLogin.mockClear()
  })

  it('calls login() when the connect button is clicked', async () => {
    const wrapper = mount(DiscogsAuthPrompt)
    await wrapper.find('button').trigger('click')
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })
})
