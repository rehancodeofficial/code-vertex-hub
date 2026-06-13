/* eslint-disable @typescript-eslint/no-explicit-any */
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/lib/api/query-hooks";
import { getDocumentsFn, getEmployeesFn } from "@/lib/api/app.functions";
import { FileText, Upload, Download, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";

export function DocumentsPage() {
  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: getDocumentsFn,
  });

  const { data: employees, isLoading: empsLoading } = useQuery({
    queryKey: ["employees"],
    queryFn: getEmployeesFn,
  });

  if (docsLoading || empsLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const docsData = documents || [];
  const empsData = employees || [];

  return (
    <>
      <PageHeader
        title="Documents"
        description="Contracts, certificates, offer letters and identity records."
        actions={
          <Button className="gradient-primary text-primary-foreground shadow-glow">
            <Upload className="size-4" /> Upload
          </Button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {docsData.map((d: any) => {
          const emp = empsData.find((e: any) => e.id === d.employeeId);
          return (
            <Card
              key={d.id}
              className="p-5 glass shadow-elevated hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{d.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {d.type.replace("_", " ")} · {(d.sizeKb / 1024).toFixed(2)} MB
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {emp?.fullName} · {formatDate(d.uploadedAt)}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full">
                <Download className="size-3.5" /> Download
              </Button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
