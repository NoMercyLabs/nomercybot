import { getInitials } from '@/lib/utils/string'

describe('getInitials', () => {
  it('returns first letter of a single word, uppercased', () => {
    expect(getInitials('Alice')).toBe('A')
  })

  it('returns first letters of first two words', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })

  it('uses only first two words when there are more', () => {
    expect(getInitials('John Michael Doe')).toBe('JM')
  })

  it('uppercases lowercase input', () => {
    expect(getInitials('john doe')).toBe('JD')
  })

  it('handles single character name', () => {
    expect(getInitials('X')).toBe('X')
  })
})
