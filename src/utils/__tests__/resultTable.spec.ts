import { RESULT_TABLE_HEADERS, joinArrayField } from '@/utils/resultTable'

describe('RESULT_TABLE_HEADERS', () => {
  it('exposes the shared column keys in display order', () => {
    expect(RESULT_TABLE_HEADERS.map((h) => h.key)).toEqual([
      'title',
      'type',
      'year',
      'country',
      'genre',
      'style',
      'community.want',
    ])
  })
})

describe('joinArrayField', () => {
  it('joins an array of strings with a comma and space', () => {
    expect(joinArrayField(['Rock', 'Non-Music'])).toBe('Rock, Non-Music')
  })

  it('returns an empty string for undefined', () => {
    expect(joinArrayField(undefined)).toBe('')
  })

  it('passes through a non-array string value unchanged', () => {
    expect(joinArrayField('Vinyl')).toBe('Vinyl')
  })
})
