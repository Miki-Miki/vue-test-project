export interface DiscogsResponse<T> {
  ok: boolean
  status: number
  statusText: string
  data: T
}

export async function discogsRequest<T>(url: string, init?: RequestInit): Promise<DiscogsResponse<T>> {
  const response = init ? await fetch(url, init) : await fetch(url)
  const data = (await response.json()) as T
  return { ok: response.ok, status: response.status, statusText: response.statusText, data }
}
