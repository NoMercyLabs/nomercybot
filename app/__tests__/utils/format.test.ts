import {
  formatDuration,
  formatNumber,
  formatRelativeTime,
  formatDate,
  formatTime,
} from '@/lib/utils/format'

describe('formatDuration', () => {
  it('formats milliseconds under a minute as seconds', () => {
    expect(formatDuration(5000)).toBe('5s')
    expect(formatDuration(59000)).toBe('59s')
  })

  it('formats milliseconds under an hour as minutes and seconds', () => {
    expect(formatDuration(60000)).toBe('1m 0s')
    expect(formatDuration(90000)).toBe('1m 30s')
    expect(formatDuration(3540000)).toBe('59m 0s')
  })

  it('formats milliseconds over an hour as hours and minutes', () => {
    expect(formatDuration(3600000)).toBe('1h 0m')
    expect(formatDuration(5400000)).toBe('1h 30m')
    expect(formatDuration(7384000)).toBe('2h 3m')
  })

  it('formats zero as 0s', () => {
    expect(formatDuration(0)).toBe('0s')
  })
})

describe('formatNumber', () => {
  it('returns plain string for numbers under 1000', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(999)).toBe('999')
  })

  it('formats thousands with K suffix', () => {
    expect(formatNumber(1000)).toBe('1.0K')
    expect(formatNumber(1500)).toBe('1.5K')
    expect(formatNumber(999999)).toBe('1000.0K')
  })

  it('formats millions with M suffix', () => {
    expect(formatNumber(1_000_000)).toBe('1.0M')
    expect(formatNumber(2_500_000)).toBe('2.5M')
  })
})

describe('formatRelativeTime', () => {
  const now = new Date()

  it('returns "just now" for times within the last minute', () => {
    const recent = new Date(now.getTime() - 30 * 1000).toISOString()
    expect(formatRelativeTime(recent)).toBe('just now')
  })

  it('returns minutes ago for times within the last hour', () => {
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString()
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago')
  })

  it('returns hours ago for times within the last day', () => {
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(twoHoursAgo)).toBe('2h ago')
  })

  it('returns days ago for times older than a day', () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago')
  })
})

describe('formatDate', () => {
  it('formats ISO string as human-readable date', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z')
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatTime', () => {
  it('formats ISO string as HH:MM time', () => {
    const result = formatTime('2024-01-15T14:30:00.000Z')
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})
