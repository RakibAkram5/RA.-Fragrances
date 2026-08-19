import "server-only";

import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Append an admin audit-log entry. Never log passwords, tokens or other
 * secrets — only the *fact* that an action happened plus entity identifiers.
 */
export async function logAudit(params: {
  adminUserId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  await prisma.adminAuditLog
    .create({
      data: {
        adminUserId: params.adminUserId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        meta: params.meta ? (params.meta as Prisma.InputJsonValue) : undefined,
        ip: params.ip,
        userAgent: params.userAgent,
      },
    })
    .catch((err) => {
      // Audit failures must never break the primary action.
      console.error("[audit] failed to write audit log", err);
    });
}
