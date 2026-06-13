/* eslint-disable @typescript-eslint/no-explicit-any */
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@/lib/api/query-hooks";
import { getAuditLogsFn } from "@/lib/api/app.functions";
import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/lib/format";
import { Loader2 } from "lucide-react";

const actionStyle: Record<string, string> = {
  CREATE: "bg-[--color-success]/15 text-[--color-success] border-[--color-success]/30",
  UPDATE: "bg-[--color-info]/15 text-[--color-info] border-[--color-info]/30",
  DELETE: "bg-destructive/15 text-destructive border-destructive/30",
  LOGIN: "bg-muted text-muted-foreground border-border",
  ROLE_CHANGE: "bg-primary/15 text-primary border-primary/30",
};

export function AuditLogsPage() {
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ["auditLogs"],
    queryFn: getAuditLogsFn,
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const logsData = auditLogs || [];

  return (
    <>
      <PageHeader
        title="Audit logs"
        description="Immutable record of all data changes, logins, and permission updates."
      />
      <Card className="glass shadow-elevated p-4 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="text-right">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logsData.map((l: any) => (
              <TableRow key={l.id}>
                <TableCell className="font-medium text-sm">{l.actor}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={actionStyle[l.action] ?? ""}>
                    {l.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{l.target}</TableCell>
                <TableCell className="text-xs font-mono text-muted-foreground">{l.ip}</TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {relativeTime(l.timestamp)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
