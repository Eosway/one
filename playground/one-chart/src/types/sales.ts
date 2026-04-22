export interface SalesPreset {
  readonly label: string
  readonly subtitle: string
  readonly months: string[]
  readonly values: number[]
  readonly color: string
}

export interface SalesChartControl {
  highlightPeak: () => void
  rerender: () => void
}
