"use server"

import { getErrorMessage } from "@/lib/handle-error"

/**
 * Result type for server actions that return data or an error message.
 */
export type ActionResult<T = null> =
  | { data: T; error: null }
  | { data: null; error: string }

/**
 * Wraps a server action function with standardized error handling.
 * Catches any thrown error and returns `{ data: null, error: string }`.
 *
 * Usage:
 * ```ts
 * export const myAction = createAction(async (input: MyInput) => {
 *   // do work...
 *   return someData // or null
 * })
 * ```
 */
export function createAction<TInput, TOutput = null>(
  fn: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<ActionResult<TOutput>> {
  return async (input: TInput) => {
    try {
      const data = await fn(input)
      return { data, error: null }
    } catch (err) {
      return { data: null, error: getErrorMessage(err) }
    }
  }
}
