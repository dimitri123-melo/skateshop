import { isClerkAPIResponseError } from "@clerk/nextjs/errors"
import { toast } from "sonner"
import * as z from "zod"

import { unknownError } from "@/lib/constants"
import { logger } from "@/lib/logger"

export function getErrorMessage(err: unknown) {
  if (err instanceof z.ZodError) {
    return err.errors[0]?.message ?? unknownError
  } else if (isClerkAPIResponseError(err)) {
    return err.errors[0]?.longMessage ?? unknownError
  } else if (err instanceof Error) {
    return err.message
  } else {
    return unknownError
  }
}

export function showErrorToast(err: unknown) {
  const errorMessage = getErrorMessage(err)
  return toast.error(errorMessage)
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly context?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, "UNAUTHORIZED", 401)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id ${id} not found` : `${resource} not found`,
      "NOT_FOUND",
      404,
      { resource, id }
    )
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400, { field })
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, "FORBIDDEN", 403)
  }
}

export function handleServerActionError(
  err: unknown,
  action: string
): { data: null; error: string } {
  const message = getErrorMessage(err)
  logger.error(`Server action failed: ${action}`, { action, error: err })
  return { data: null, error: message }
}
