import { useEffect } from "react";
import { Outlet, Navigate } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-store";

/** Protects all child routes — redirects to /auth if not logged in */
export function AuthGuard() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const checkSession = useAuth((s) => s.checkSession);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <Outlet />;
}
