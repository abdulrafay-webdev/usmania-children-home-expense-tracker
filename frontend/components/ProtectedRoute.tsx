"use client";

import { useAuth } from "@/lib/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { HeartHandshake, Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        router.push("/login");
      } else if (isAuthenticated && isLoginPage) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 mb-4 animate-pulse">
          <HeartHandshake className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Securing session...</span>
        </div>
      </div>
    );
  }

  // Not logged in and not on login page: hold render while redirecting
  if (!isAuthenticated && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
