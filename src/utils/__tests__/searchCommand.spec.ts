import { SearchMode } from '@/types/search'
import { parseSearchCommand, formatCommand, SEARCH_COMMANDS } from '@/utils/searchCommand'

describe('SEARCH_COMMANDS', () => {
  it.each(SEARCH_COMMANDS)('$keyword parses and round-trips through formatCommand', (command) => {
    expect(parseSearchCommand(`${command.keyword} rock`)).toEqual({
      mode: command.mode,
      term: 'rock',
      raw: `${command.keyword} rock`,
    })
    expect(parseSearchCommand(formatCommand(command.mode, 'Hip Hop')).term).toBe('Hip Hop')
  })
})

describe('parseSearchCommand', () => {
  it('parses a simple /genre command', () => {
    expect(parseSearchCommand('/genre rock')).toEqual({
      mode: SearchMode.Genre,
      term: 'rock',
      raw: '/genre rock',
    })
  })

  it('parses a simple /style command', () => {
    expect(parseSearchCommand('/style acid')).toEqual({
      mode: SearchMode.Style,
      term: 'acid',
      raw: '/style acid',
    })
  })

  it('is case-insensitive on the command keyword', () => {
    expect(parseSearchCommand('/GENRE Rock')).toEqual({
      mode: SearchMode.Genre,
      term: 'Rock',
      raw: '/GENRE Rock',
    })
    expect(parseSearchCommand('/STYLE Acid')).toEqual({
      mode: SearchMode.Style,
      term: 'Acid',
      raw: '/STYLE Acid',
    })
  })

  it('unwraps double-quoted multi-word values', () => {
    expect(parseSearchCommand('/genre "hip hop"')).toEqual({
      mode: SearchMode.Genre,
      term: 'hip hop',
      raw: '/genre "hip hop"',
    })
    expect(parseSearchCommand('/style "new beat"')).toEqual({
      mode: SearchMode.Style,
      term: 'new beat',
      raw: '/style "new beat"',
    })
  })

  it('unwraps single-quoted multi-word values', () => {
    expect(parseSearchCommand(`/genre 'hip hop'`)).toEqual({
      mode: SearchMode.Genre,
      term: 'hip hop',
      raw: `/genre 'hip hop'`,
    })
  })

  it('collapses internal whitespace in an unquoted multi-word value', () => {
    expect(parseSearchCommand('/style   new   beat')).toEqual({
      mode: SearchMode.Style,
      term: 'new beat',
      raw: '/style   new   beat',
    })
  })

  it('trims leading/trailing whitespace from the whole input', () => {
    expect(parseSearchCommand('   /genre rock   ')).toEqual({
      mode: SearchMode.Genre,
      term: 'rock',
      raw: '/genre rock',
    })
  })

  it('treats a bare command as its mode with an empty term', () => {
    expect(parseSearchCommand('/genre')).toEqual({ mode: SearchMode.Genre, term: '', raw: '/genre' })
    expect(parseSearchCommand('/style')).toEqual({ mode: SearchMode.Style, term: '', raw: '/style' })
  })

  it('does not treat a near-miss prefix as a command', () => {
    expect(parseSearchCommand('/genres rock')).toEqual({
      mode: SearchMode.Track,
      term: '/genres rock',
      raw: '/genres rock',
    })
    expect(parseSearchCommand('/genrerock')).toEqual({
      mode: SearchMode.Track,
      term: '/genrerock',
      raw: '/genrerock',
    })
    expect(parseSearchCommand('/stylee acid')).toEqual({
      mode: SearchMode.Track,
      term: '/stylee acid',
      raw: '/stylee acid',
    })
  })

  it('treats ordinary input as a track search', () => {
    expect(parseSearchCommand('nirvana')).toEqual({ mode: SearchMode.Track, term: 'nirvana', raw: 'nirvana' })
  })

  it('leaves an unbalanced quote as-is (minus trimming)', () => {
    expect(parseSearchCommand('/genre "hip hop')).toEqual({
      mode: SearchMode.Genre,
      term: '"hip hop',
      raw: '/genre "hip hop',
    })
  })
})

describe('formatCommand', () => {
  it('does not quote a single-word value', () => {
    expect(formatCommand(SearchMode.Genre, 'Rock')).toBe('/genre Rock')
    expect(formatCommand(SearchMode.Style, 'Acid')).toBe('/style Acid')
  })

  it('quotes a multi-word value', () => {
    expect(formatCommand(SearchMode.Genre, 'Hip Hop')).toBe('/genre "Hip Hop"')
    expect(formatCommand(SearchMode.Style, 'New Beat')).toBe('/style "New Beat"')
  })

  it('round-trips through parseSearchCommand', () => {
    expect(parseSearchCommand(formatCommand(SearchMode.Genre, 'Rock')).term).toBe('Rock')
    expect(parseSearchCommand(formatCommand(SearchMode.Style, 'Hard Beat')).term).toBe('Hard Beat')
  })

  it('falls back to the raw trimmed value for a mode with no registered command (Track)', () => {
    expect(formatCommand(SearchMode.Track, '  nirvana  ')).toBe('nirvana')
  })
})
