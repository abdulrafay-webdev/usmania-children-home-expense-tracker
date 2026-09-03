"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartHandshake,
  LayoutDashboard,
  Users,
  PlusCircle,
  Menu,
  X,
  LogOut,
  UserCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import PersonModal from "./PersonModal";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const [isAddPersonOpen, setIsAddPersonOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu whenever route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isLoginPage = pathname === "/login";

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Name */}
            <Link href={isAuthenticated ? "/" : "/login"} className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200 group-hover:bg-emerald-700 transition-colors shrink-0">
                <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-base sm:text-lg text-slate-800 tracking-tight block leading-tight truncate">
                  Usmania Children Home
                </span>
                <span className="text-[11px] sm:text-xs font-medium text-emerald-700 block truncate">
                  Expense &amp; Donation Tracker
                </span>
              </div>
            </Link>

            {/* If on Login Page, show minimal indicator */}
            {isLoginPage ? (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Sign In</span>
              </div>
            ) : isAuthenticated ? (
              <>
                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-2">
                  <Link
                    href="/"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive("/")
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/persons"
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive("/persons")
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Persons</span>
                  </Link>

                  <button
                    onClick={() => setIsAddPersonOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-sm transition-all active:scale-95"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Person</span>
                  </button>

                  <div className="h-5 w-px bg-slate-200 mx-1" />

                  {/* User Profile Badge */}
                  <div className="flex items-center gap-2 pl-1">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      SR
                    </div>
                    <div className="text-left hidden xl:block">
                      <span className="text-xs font-semibold text-slate-800 block leading-tight">
                        {user?.name || "Saif Ur Rehman"}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight">
                        {user?.email || "saifurrehman@gmail.com"}
                      </span>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </nav>

                {/* Medium screens (Tablet / Foldable) */}
                <div className="hidden sm:flex lg:hidden items-center gap-2">
                  <Link
                    href="/"
                    className={`p-2 rounded-lg text-sm ${
                      isActive("/") ? "bg-emerald-50 text-emerald-700" : "text-slate-600"
                    }`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/persons"
                    className={`p-2 rounded-lg text-sm ${
                      isActive("/persons") ? "bg-emerald-50 text-emerald-700" : "text-slate-600"
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => setIsAddPersonOpen(true)}
                    className="p-2 rounded-lg bg-emerald-600 text-white shadow-sm"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={logout}
                    title="Sign Out"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Actions: Add button + Hamburger Menu Icon */}
                <div className="flex items-center gap-1.5 sm:hidden">
                  <button
                    onClick={() => setIsAddPersonOpen(true)}
                    aria-label="Quick Add Person"
                    className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <PlusCircle className="w-5 h-5" />
                  </button>

                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle Mobile Navigation Menu"
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  >
                    {isMobileMenuOpen ? (
                      <X className="w-6 h-6 text-slate-800" />
                    ) : (
                      <Menu className="w-6 h-6 text-slate-800" />
                    )}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {/* User Profile Info Card in Mobile Menu */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                SR
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 block truncate">
                  {user?.name || "Saif Ur Rehman"}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {user?.email || "saifurrehman@gmail.com"}
                </span>
              </div>
            </div>

            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive("/")
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <LayoutDashboard className="w-5 h-5 text-emerald-600" />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/persons"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive("/persons")
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Persons &amp; Contributor Accounts</span>
            </Link>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAddPersonOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add New Person</span>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-sm font-semibold transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Quick Add Person Modal */}
      {isAuthenticated && (
        <PersonModal
          isOpen={isAddPersonOpen}
          onClose={() => setIsAddPersonOpen(false)}
          onSuccess={() => {
            setIsAddPersonOpen(false);
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
        />
      )}
    </>
  );
}
