import type { CSSProperties } from 'vue'

export const LAYOUT_STYLES = {
  root: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  empty: {
    width: '100%',
    height: '100%',
  },
  viewport: {
    width: '100%',
    height: '100%',
  },
  loopGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  item: {
    flex: '0 0 auto',
  },
} satisfies Record<string, CSSProperties>
