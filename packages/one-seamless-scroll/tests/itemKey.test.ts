import { describe, expect, it } from 'vitest'
import { appendLoopSuffix, resolveSeamlessItemKey } from '../src/utils/itemKey'

describe('itemKey utils', () => {
  it('keeps the original key for the first loop', () => {
    expect(appendLoopSuffix('alpha', 0)).toBe('alpha')
    expect(appendLoopSuffix(3, 0)).toBe(3)
  })

  it('appends the loop suffix for duplicated groups', () => {
    expect(appendLoopSuffix('alpha', 1)).toBe('alpha::1')
    expect(appendLoopSuffix(3, 2)).toBe('3::2')
  })

  it('resolves itemKey from a function', () => {
    const item = { id: 7, name: 'Alpha' }

    expect(resolveSeamlessItemKey(item, 0, 0, (current) => current.id)).toBe(7)
    expect(resolveSeamlessItemKey(item, 0, 1, (current) => current.id)).toBe('7::1')
  })

  it('resolves itemKey from a property name and falls back to index', () => {
    expect(resolveSeamlessItemKey({ id: 9 }, 2, 0, 'id')).toBe(9)
    expect(resolveSeamlessItemKey({ name: 'Alpha' }, 2, 1, 'id' as never)).toBe('2::1')
    expect(resolveSeamlessItemKey({ name: 'Alpha' }, 2, 0, undefined)).toBe(2)
  })
})
