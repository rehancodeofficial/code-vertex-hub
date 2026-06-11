import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui-ext/status-badge";
import { attendance, employees, employeeById } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-store";
import { StatCard } from "@/components/ui-ext/stat-card";
import { Clock, LogIn, LogOut, CalendarCheck, Search, Timer } from "lucide-react";
import { formatDate, initials } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/attendance")({ component: AttendancePage });

function AttendancePage() {
  const user = useAuth((s) => s.user)!;
  const [q, setQ] = useState("");
  const isAdmin = user.role !== "employee";

  const rows = isAdmin ? attendance.slice(0, 50) : attendance.filter((a) => a.employeeId === user.employeeId);
  const filtered = rows.filter((r) => {
    if (!q) return true;
    const emp = employeeById(r.employeeId);
    return emp && `${emp.fullName} ${emp.employeeCode}`.toLowerCase().includes(q.toLowerCase());
  });

  const today = attendance[0]?.date;
  const todayRows = attendance.filter((a) => a.date === today);
  const presentCount = todayRows.filter((a) => a.status === "present").length;
  const lateCount = todayRows.filter((a) => a.status === "late").length;
  const absentCount = todayRows.filter((a) => a.status === "absent").length;
  const onLeave = todayRows.filter((a) => a.status === "leave").length;

  return (
    <>
      <PageHeader
        title="Attendance"
        description={isAdmin ? "Track team attendance, late arrivals, and absences." : "Check in, check out and view your attendance history."}
        actions={
          <>
            <Button variant="outline" onClick={() => toast.success("Checked in at " + new Date().toLocaleTimeString())}>
              <LogIn className="size-4" /> Check in
            </Button>
            <Button className="gradient-primary text-primary-foreground shadow-glow" onClick={() => toast.success("Checked out")}>
              <LogOut className="size-4" /> Check out
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Present today" value={presentCount} icon={CalendarCheck} accent="success" />
        <StatCard label="Late" value={lateCount} icon={Timer} accent="warning" />
        <StatCard label="Absent" value={absentCount} icon={Clock} accent="primary" />
        <StatCard label="On leave" value={onLeave} icon={Clock} accent="info" />
      </div>

      <Card className="glass shadow-elevated p-4 mt-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input placeholder="Search employee…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9 bg-muted/40 max-w-sm" />
          </div>
        </div>

        <div className="overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 30).map((r) => {
                const emp = employeeById(r.employeeId);
                return (
                  <TableRow key={r.id}>
                    {isAdmin && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="size-7"><AvatarFallback className="text-[10px]">{initials(emp?.fullName ?? "?")}</AvatarFallback></Avatar>
                          <span className="text-sm">{emp?.fullName}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="text-sm">{formatDate(r.date)}</TableCell>
                    <TableCell className="text-sm tabular-nums">{r.checkIn ?? "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{r.checkOut ?? "—"}</TableCell>
                    <TableCell className="text-sm tabular-nums">{r.hours}h</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground mt-2">Employees shown: {employees.length}. Records: {filtered.length}.</p>
    </>
  );
}
