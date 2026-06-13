import { index, json, pgEnum, pgTable, text, varchar } from "drizzle-orm/pg-core"

import { generateId } from "@/lib/id"

import { lifecycleDates } from "./utils"

export const auditActionEnum = pgEnum("audit_action", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "purchase",
  "refund",
  "subscription_change",
  "role_change",
  "settings_change",
])

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: varchar("id", { length: 30 })
      .$defaultFn(() => generateId())
      .primaryKey(),
    userId: varchar("user_id", { length: 36 }),
    action: auditActionEnum("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: varchar("entity_id", { length: 30 }),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    ...lifecycleDates,
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
    actionIdx: index("audit_logs_action_idx").on(table.action),
    entityTypeIdx: index("audit_logs_entity_type_idx").on(table.entityType),
    entityIdIdx: index("audit_logs_entity_id_idx").on(table.entityId),
  })
)

export type AuditLog = typeof auditLogs.$inferSelect
export type NewAuditLog = typeof auditLogs.$inferInsert
