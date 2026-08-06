import { ref, onMounted } from 'vue'

const SESSION_KEY = 'discogs_authenticated'

// Initialise from sessionStorage so state survives a page refresh within the same tab
const authenticated = ref(sessionStorage.getItem(SESSION_KEY) === 'true')

export function useDiscogsAuth() {
  onMounted(async () => {
    try {
      const res = await fetch('/auth/discogs/status')
      const data = await res.json()
      authenticated.value = data.authenticated
      // Keep sessionStorage in sync; clear it if the dev-server token was lost (e.g. Vite restart)
      if (data.authenticated) {
        sessionStorage.setItem(SESSION_KEY, 'true')
      } else {
        sessionStorage.removeItem(SESSION_KEY)
      }
    } catch {
      // Network error — trust the cached value for now
    }
  })

  async function login() {
    const res = await fetch('/auth/discogs/login', { method: 'POST' })
    const { authorizeUrl } = await res.json()
    window.location.href = authorizeUrl
  }

  function logout() {
    authenticated.value = false
    sessionStorage.removeItem(SESSION_KEY)
  }

  return { authenticated, login, logout }
}
