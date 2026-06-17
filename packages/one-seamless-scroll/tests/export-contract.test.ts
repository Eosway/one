import { describe, expect, it } from 'vitest'
import * as seamlessScroll from '../src'
import OneSeamlessScrollComponent from '../src/components/OneSeamlessScroll.vue'

describe('@eosway/one-seamless-scroll export contract', () => {
  it('only exposes the component from the runtime entry', () => {
    expect(Object.keys(seamlessScroll).sort()).toEqual(['OneSeamlessScroll'])
    expect(seamlessScroll.OneSeamlessScroll).toBe(OneSeamlessScrollComponent)
  })
})
