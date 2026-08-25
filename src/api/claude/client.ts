export interface ClaudeResponse<T> {
  ok: boolean
  status: number
  statusText: string
  data: T
}

export async function claudeRequest<T>(url: string, init?: RequestInit): Promise<ClaudeResponse<T>> {
  const response = init ? await fetch(url, init) : await fetch(url)
  const data = (await response.json()) as T
  return { ok: response.ok, status: response.status, statusText: response.statusText, data }
}
