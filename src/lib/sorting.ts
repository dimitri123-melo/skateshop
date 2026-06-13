/**
 * Shared sorting utilities for parsing sort strings (e.g. "createdAt.desc")
 * into column/order tuples, used across dashboard pages and server actions.
 */

export type SortOrder = "asc" | "desc"

export interface SortResult<T extends string = string> {
  column: T | undefined
  order: SortOrder | undefined
}

export function parseSortString<T extends string = string>(
  sort: string | undefined
): SortResult<T> {
  const [column, order] = (sort?.split(".") as [
    T | undefined,
    SortOrder | undefined,
  ]) ?? [undefined, undefined]

  return { column, order }
}
