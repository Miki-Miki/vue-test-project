export interface DataTableHeader {
  title: string
  key: string
  width?: string
}

export const RESULT_TABLE_HEADERS: DataTableHeader[] = [
  { title: 'Title', key: 'title', width: '350px' },
  { title: 'Type', key: 'type' },
  { title: 'Year', key: 'year' },
  { title: 'Country', key: 'country' },
  { title: 'Genre', key: 'genre' },
  { title: 'Style', key: 'style' },
  { title: 'Want', key: 'community.want' },
]

export function joinArrayField(value: unknown): string {
  return Array.isArray(value) ? value.join(', ') : ((value as string) ?? '')
}
