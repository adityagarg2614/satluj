"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpRight,
  Book,
  BriefcaseBusiness,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import { logoutAction } from "@/app/admin/actions";
import { SubmitButton } from "@/components/submit-button";
import { DAILY_WAGE_RECORDS_LABEL } from "@/lib/worker-utils";

type AdminShellProps = {
  adminName: string;
  children: React.ReactNode;
};

type NavItem = {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: Array<{
    title: string;
    href: string;
  }>;
};

const navItems: NavItem[] = [
  {
    title: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Management",
    icon: BriefcaseBusiness,
    children: [
      {
        title: "Add Worker",
        href: "/admin/workers",
      },
      {
        title: "Mark Attendance",
        href: "/admin/attendance",
      },
      {
        title: "Monthly Summary",
        href: "/admin/attendance-summary",
      },
      {
        title: DAILY_WAGE_RECORDS_LABEL,
        href: "/admin/dihadi-records",
      },
    ],
  },
  {
    title: "Daybook",
    icon: Book,
    children: [
      {
        title: "Record Entry",
        href: "/admin/daybook",
      },
      {
        title: "View Records",
        href: "/admin/daybook-records",
      },
    ],
  },
  {
    title: "Revert Scrap",
    href: "/admin/revert-scrap",
    icon: Scale,
  },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/admin/workers/") && pathname.endsWith("/attendance")) {
    return "Worker Monthly Attendance";
  }

  if (pathname.startsWith("/admin/workers/")) {
    return "Worker Salary Ledger";
  }

  if (pathname === "/admin/workers") {
    return "Worker Management";
  }

  if (pathname === "/admin/attendance") {
    return "Attendance Management";
  }

  if (pathname === "/admin/attendance-summary") {
    return "Monthly Attendance Summary";
  }

  if (pathname === "/admin/dihadi-records") {
    return DAILY_WAGE_RECORDS_LABEL;
  }

  if (pathname === "/admin/daybook") {
    return "Daybook Record Entry";
  }

  if (pathname === "/admin/daybook-records") {
    return "Daybook Records View";
  }

  if (pathname === "/admin/revert-scrap") {
    return "Revert Scrap Tracking";
  }

  return "Admin Dashboard";
}

export function AdminShell({ adminName, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || (child.href === "/admin/workers" && pathname.startsWith("/admin/workers/"))
        );
        if (hasActiveChild) {
          initial[item.title] = true;
        }
      }
    });
    return initial;
  });

  const toggleDropdown = (title: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const sidebar = (
    <aside className="flex h-full w-[290px] flex-col border-r border-white/10 bg-[rgba(7,11,17,0.96)] backdrop-blur-2xl">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-lg">
            <Sparkles className="size-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-semibold text-white">Satluj Stones</span>
            <span className="text-[11px] text-slate-400">Admin Control</span>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div>
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Platform
          </p>

          <nav className="mt-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasActiveChild = item.children?.some(
                (child) => pathname === child.href || (child.href === "/admin/workers" && pathname.startsWith("/admin/workers/"))
              );
              const isActive = item.href ? pathname === item.href : hasActiveChild;
              const isOpen = !!openDropdowns[item.title];

              if (!item.children?.length) {
                return (
                  <Link
                    key={item.title}
                    href={item.href!}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive
                      ? "bg-white/8 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                  </Link>
                );
              }

              return (
                <div key={item.title} className="rounded-2xl">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(item.title)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${isActive
                      ? "bg-white/8 text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.title}</span>
                    <ChevronRight
                      className={`ml-auto size-4 transition-transform ${isOpen ? "rotate-90" : ""
                        }`}
                    />
                  </button>

                  {isOpen ? (
                    <div className="mt-2 space-y-1 border-l border-white/10 pl-5">
                      {item.children.map((child) => {
                        const childActive = pathname === child.href || (child.href === "/admin/workers" && pathname.startsWith("/admin/workers/"));

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`block rounded-xl px-3 py-2 text-sm transition ${childActive
                              ? "bg-amber-300/12 text-amber-100"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                              }`}
                          >
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>
        </div>
      </div>


    </aside>
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div className="lg:hidden">
        {mobileOpen ? (
          <div
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div
          className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <div className="flex h-full">
            {sidebar}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="mt-4 ml-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-white"
              aria-label="Close sidebar"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block">{sidebar}</div>

      <div className="lg:pl-[290px]">
        <nav className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(8,12,18,0.78)] backdrop-blur-xl">
          <div className="mx-auto flex h-14 items-center justify-between px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/4 text-white lg:hidden"
                aria-label="Open sidebar"
              >
                <Menu className="size-5" />
              </button>

              <div>
                <p className="text-sm font-semibold text-white">{getPageTitle(pathname)}</p>
                <p className="text-xs text-slate-400">Protected admin workspace</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-semibold text-emerald-100 md:flex">
                <ShieldCheck className="size-4" />
                Secure access
              </div>

              <div className="hidden min-w-0 rounded-full border border-white/10 bg-white/4 px-4 py-2 text-sm text-slate-200 xl:block">
                <span className="text-slate-400">Admin:</span>{" "}
                <span className="font-semibold text-white">{adminName}</span>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm font-semibold text-white transition hover:border-amber-300/35 hover:text-amber-200"
              >
                Visitor View
                <ArrowUpRight className="size-4" />
              </Link>

              <form action={logoutAction}>
                <SubmitButton
                  label="Logout"
                  pendingLabel="Logging out..."
                  className="inline-flex items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
                />
              </form>
            </div>
          </div>
        </nav>

        <div className="px-6 py-8 lg:px-8">{children}</div>
      </div>
    </div>
  );
}
