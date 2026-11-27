import type { CSSProperties } from 'vue'

export const LAYOUT_STYLES = {
  root: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  rootReducedMotion: {
    width: '100%',
    height: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  empty: {
    width: '100%',
    height: '100%',
  },
  viewport: {
    width: '100%',
    height: '100%',
  },
  viewportReducedMotion: {
    width: '100%',
    height: 'auto',
  },
  loopGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  item: {
    flex: '0 0 auto',
  },
} satisfies Record<string, CSSProperties>
