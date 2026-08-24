import { mount } from '@vue/test-utils'
import AuthPrompt from '@/components/AuthPrompt/AuthPrompt.vue'

const mockLogin = jest.fn()

jest.mock('@/composables/useDiscogsAuth', () => ({
  useDiscogsAuth: () => ({ login: mockLogin, logout: jest.fn(), authenticated: { value: false } }),
}))

describe('AuthPrompt', () => {
  beforeEach(() => {
    mockLogin.mockClear()
  })

  it('calls login() when the connect button is clicked', async () => {
    const wrapper = mount(AuthPrompt)
    await wrapper.find('button').trigger('click')
    expect(mockLogin).toHaveBeenCalledTimes(1)
  })
})
