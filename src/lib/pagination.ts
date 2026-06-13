/**
 * Shared pagination utilities for computing page offsets and limits
 * from search params across dashboard pages and server actions.
 */

export interface PaginationInput {
  page: number
  per_page: number
}

export interface PaginationResult {
  page: number
  limit: number
  offset: number
}

export function getPagination(input: PaginationInput): PaginationResult {
  const page = isNaN(input.page) || input.page < 1 ? 1 : input.page
  const limit = isNaN(input.per_page) ? 10 : input.per_page
  const offset = page > 0 ? (page - 1) * limit : 0

  return { page, limit, offset }
}
