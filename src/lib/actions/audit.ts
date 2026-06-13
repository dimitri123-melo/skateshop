"use server"

import { db } from "@/db"
import { auditLogs, type NewAuditLog } from "@/db/schema"
import { desc, eq } from "drizzle-orm"

import { logger } from "@/lib/logger"

export async function createAuditLog(
  input: Omit<NewAuditLog, "id" | "createdAt" | "updatedAt">
) {
  try {
    await db.insert(auditLogs).values(input)
  } catch (err) {
    logger.error("Failed to create audit log", {
      action: "createAuditLog",
      error: err,
    })
  }
}

export async function getAuditLogs(input: {
  userId?: string
  entityType?: string
  entityId?: string
  limit?: number
  offset?: number
}) {
  try {
    let query = db.select().from(auditLogs).$dynamic()

    if (input.userId) {
      query = query.where(eq(auditLogs.userId, input.userId))
    }

    if (input.entityType) {
      query = query.where(eq(auditLogs.entityType, input.entityType))
    }

    if (input.entityId) {
      query = query.where(eq(auditLogs.entityId, input.entityId))
    }

    const logs = await query
      .orderBy(desc(auditLogs.createdAt))
      .limit(input.limit ?? 50)
      .offset(input.offset ?? 0)

    return { data: logs, error: null }
  } catch (err) {
    logger.error("Failed to fetch audit logs", {
      action: "getAuditLogs",
      error: err,
    })
    return { data: [], error: "Failed to fetch audit logs" }
  }
}
