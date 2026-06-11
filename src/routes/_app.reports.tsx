import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { employees, attendance, leaveRequests, projects, assets, departments } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { toast } from "sonner";

const reports = [
  { id: "emp", title: "Employee report", desc: "Headcount, status, department distribution." },
  { id: "att", title: "Attendance report", desc: "Daily attendance, late arrivals, absentees." },
  { id: "leave", title: "Leave report", desc: "Approvals, balances, and type breakdown." },
  { id: "proj", title: "Project report", desc: "Status, progress, and budget utilization." },
  { id: "asset", title: "Asset report", desc: "Allocation, value, and lifecycle status." },
];

export const Route = createFileRoute("/_app/reports")({ component: ReportsPage });

function ReportsPage() {
  const deptData = departments.map((d) => ({ name: d.code, count: d.headcount }));
  const trend = attendance.reduce<Record<string, number>>((acc, a) => {
    acc[a.date] = (acc[a.date] ?? 0) + (a.status === "present" ? 1 : 0); return acc;
  }, {});
  const trendData = Object.entries(trend).sort(([a], [b]) => a.localeCompare(b)).slice(-10)
    .map(([date, present]) => ({ date: new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }), present }));

  const totals = {
    emp: employees.length, att: attendance.length, leave: leaveRequests.length, proj: projects.length, asset: assets.length,
  };

  function exportAs(fmt: "pdf" | "excel" | "csv") { toast.success(`Report exported as ${fmt.toUpperCase()}`); }

  return (
    <>
      <PageHeader
        title="Reports & analytics"
        description="Generate and export detailed reports across modules."
        actions={
          <>
            <Button variant="outline" onClick={() => exportAs("pdf")}><FileText className="size-4" /> PDF</Button>
            <Button variant="outline" onClick={() => exportAs("excel")}><FileSpreadsheet className="size-4" /> Excel</Button>
            <Button variant="outline" onClick={() => exportAs("csv")}><FileDown className="size-4" /> CSV</Button>
          </>
        }
      />

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold">Headcount by department</h3>
          <p className="text-xs text-muted-foreground mb-4">Active employees</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5 glass shadow-elevated">
          <h3 className="font-display font-semibold">Attendance trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Daily present count</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="date" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={{ background: "var(--color-popover)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="present" stroke="var(--color-secondary)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <Card key={r.id} className="p-5 glass shadow-elevated hover:border-primary/40 transition-colors">
            <h3 className="font-display font-semibold">{r.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{r.desc}</p>
            <p className="text-xs text-muted-foreground mt-3">{totals[r.id as keyof typeof totals]} records</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => exportAs("pdf")}>PDF</Button>
              <Button size="sm" variant="outline" onClick={() => exportAs("excel")}>Excel</Button>
              <Button size="sm" variant="outline" onClick={() => exportAs("csv")}>CSV</Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
