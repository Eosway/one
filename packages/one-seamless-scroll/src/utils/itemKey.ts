import type { OneSeamlessScrollProps } from '../types/public'

/**
 * 为复制渲染的条目补充分组后缀，避免重复 key。
 */
export function appendLoopSuffix(value: string | number, loop: number): string | number {
  return loop === 0 ? value : `${String(value)}::${loop}`
}

/**
 * 解析单项渲染 key。
 */
export function resolveSeamlessItemKey<T>(item: T, index: number, loop: number, itemKey: OneSeamlessScrollProps<T>['itemKey']): string | number {
  if (typeof itemKey === 'function') {
    const value = itemKey(item, index)
    return appendLoopSuffix(value ?? index, loop)
  }

  if (itemKey) {
    const value = (item as Record<PropertyKey, unknown> | null | undefined)?.[itemKey]
    return appendLoopSuffix(typeof value === 'string' || typeof value === 'number' ? value : index, loop)
  }

  return appendLoopSuffix(index, loop)
}
