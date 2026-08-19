"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";

interface Log {
  id: string;
  action: string;
  entity: string | null;
  entityId: string | null;
  meta: unknown;
  ip: string | null;
  adminName: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = React.useState<Log[] | null>(null);

  React.useEffect(() => {
    api<{ items: Log[] }>("/api/admin/audit-logs?pageSize=100").then((d) => setLogs(d.items));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-ink">Audit Logs</h1>
        <p className="mt-1 text-sm text-ink-secondary">Important admin actions, in order.</p>
      </div>

      <div className="border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs?.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap">{formatDateTime(l.createdAt)}</TableCell>
                <TableCell>{l.adminName ?? "—"}</TableCell>
                <TableCell><span className="font-mono text-xs text-ink">{l.action}</span></TableCell>
                <TableCell>
                  {l.entity ? `${l.entity}${l.entityId ? `:${l.entityId.slice(0, 8)}` : ""}` : "—"}
                </TableCell>
                <TableCell>{l.ip ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
