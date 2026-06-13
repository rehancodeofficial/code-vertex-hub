/* eslint-disable @typescript-eslint/no-explicit-any */
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@/lib/api/query-hooks";
import {
  getNotificationsFn,
  markNotificationReadFn,
  markAllNotificationsReadFn,
} from "@/lib/api/app.functions";
import {
  Bell,
  Plane,
  ListChecks,
  Clock,
  FolderKanban,
  Cog,
  Loader2,
  CheckCheck,
} from "lucide-react";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const icons: Record<string, any> = {
  leave: Plane,
  task: ListChecks,
  attendance: Clock,
  project: FolderKanban,
  system: Cog,
};

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotificationsFn,
  });

  // Mark single notification as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) => markNotificationReadFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to mark notification"),
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsReadFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to mark all as read"),
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  const notifsData: any[] = notifications || [];
  const unreadCount = notifsData.filter((n) => n.unread || !n.readAt).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        description="System and team alerts, sorted by recency."
        actions={
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
          >
            {markAllReadMutation.isPending ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <CheckCheck className="size-4 mr-2" />
            )}
            Mark all as read
          </Button>
        }
      />

      <Card className="glass shadow-elevated divide-y divide-border">
        {notifsData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Bell className="size-10 mb-3 opacity-30" />
            <p className="text-sm">No notifications yet.</p>
          </div>
        )}

        {notifsData.map((n: any) => {
          const Icon = icons[n.kind] ?? Bell;
          // Support both `n.unread` (serialized) and `!n.readAt` (raw)
          const isUnread = n.unread === true || (n.readAt == null && n.unread !== false);

          return (
            <div
              key={n.id}
              role="button"
              tabIndex={0}
              onClick={() => isUnread && markReadMutation.mutate(n.notificationId ?? n.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && isUnread)
                  markReadMutation.mutate(n.notificationId ?? n.id);
              }}
              className={cn(
                "flex items-start gap-4 p-4 transition-colors cursor-pointer",
                isUnread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-accent/30",
              )}
            >
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="size-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{n.title}</p>
                  {isUnread && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                </div>
                <p className="text-sm text-muted-foreground">{n.body}</p>
                <p className="text-xs text-muted-foreground mt-1">{relativeTime(n.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </Card>
    </>
  );
}
