/**
 * Shared date range utilities for parsing "from"/"to" search param strings
 * into Date objects, used across dashboard pages and server actions.
 */

export interface DateRangeInput {
  from?: string
  to?: string
}

export interface DateRangeResult {
  fromDay: Date | undefined
  toDay: Date | undefined
}

export function parseDateRange(input: DateRangeInput): DateRangeResult {
  const fromDay = input.from ? new Date(input.from) : undefined
  const toDay = input.to ? new Date(input.to) : undefined

  return { fromDay, toDay }
}
