"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Check,
  Clock,
  X,
  PhoneCall,
  Sparkles,
  Calendar,
  Layers
} from "lucide-react";
import { formatDate } from "@/lib/format";

type Worker = {
  _id: string;
  name: string;
  role: string;
  phoneNumber: string;
  joiningDate: string;
};

type AttendanceRecord = {
  workerId: string;
  status: "present" | "half" | "absent";
};

type AttendanceManagerProps = {
  workers: Worker[];
  initialAttendance: AttendanceRecord[];
};

export function AttendanceManager({
  workers,
  initialAttendance,
}: AttendanceManagerProps) {
  // Create an initial map of workerId -> status
  const initialMap = useMemo(() => {
    const map: Record<string, "present" | "half" | "absent"> = {};
    workers.forEach((w) => {
      // Find matching attendance record or default to 'absent'
      const record = initialAttendance.find((r) => r.workerId === w._id);
      map[w._id] = record?.status || "absent";
    });
    return map;
  }, [workers, initialAttendance]);

  // State to track current attendance statuses
  const [attendance, setAttendance] = useState<Record<string, "present" | "half" | "absent">>(initialMap);

  // State for search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "present" | "half" | "absent">("All");

  // Get unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set(workers.map((w) => w.role));
    return ["All", ...Array.from(roles)];
  }, [workers]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((worker) => {
      const matchesSearch =
        worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        worker.role.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "All" || worker.role === roleFilter;

      const currentStatus = attendance[worker._id];
      const matchesStatus = statusFilter === "All" || currentStatus === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [workers, searchTerm, roleFilter, statusFilter, attendance]);

  // Calculate live stats based on current attendance state
  const liveStats = useMemo(() => {
    let present = 0;
    let half = 0;
    let absent = 0;

    workers.forEach((worker) => {
      const status = attendance[worker._id];
      if (status === "present") present++;
      else if (status === "half") half++;
      else absent++;
    });

    return { present, half, absent };
  }, [workers, attendance]);

  // Bulk actions
  const handleMarkAll = (status: "present" | "half" | "absent") => {
    const updated = { ...attendance };
    filteredWorkers.forEach((worker) => {
      updated[worker._id] = status;
    });
    setAttendance(updated);
  };

  // Toggle single attendance status
  const handleStatusChange = (workerId: string, status: "present" | "half" | "absent") => {
    setAttendance((prev) => ({
      ...prev,
      [workerId]: status,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Live Stats Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Present",
            value: liveStats.present,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
            icon: Check,
          },
          {
            label: "Half Day",
            value: liveStats.half,
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
            icon: Clock,
          },
          {
            label: "Absent",
            value: liveStats.absent,
            color: "text-rose-400",
            bg: "bg-rose-500/10 border-rose-500/20",
            icon: X,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-300 ${stat.bg}`}
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {stat.label} (Live)
              </span>
              <p className="mt-1 text-3xl font-bold text-white">{stat.value}</p>
            </div>
            <div className={`rounded-xl p-2 bg-slate-900/40 ${stat.color}`}>
              <stat.icon className="size-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Control Panel (Search, Filters & Bulk Actions) */}
      <div className="glass-panel rounded-3xl p-5 border border-white/8 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Search and Filters */}
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search workers by name or role..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none transition focus:border-amber-300/30 focus:bg-slate-950/60"
              />
            </div>

            {/* Role Filter */}
            <div className="relative min-w-44">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/30"
              >
                <option value="All">All Roles</option>
                {uniqueRoles.filter(r => r !== "All").map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative min-w-44">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "All" | "present" | "half" | "absent",
                  )
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-2.5 text-sm text-white outline-none transition focus:border-amber-300/30"
              >
                <option value="All">All Statuses</option>
                <option value="present">Present</option>
                <option value="half">Half Day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
              <Sparkles className="size-3.5 text-amber-200" /> Bulk Mark:
            </span>
            <button
              type="button"
              onClick={() => handleMarkAll("present")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-500/20 active:scale-95 cursor-pointer"
            >
              <Check className="size-3.5" /> Present
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("half")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Clock className="size-3.5" /> Half Day
            </button>
            <button
              type="button"
              onClick={() => handleMarkAll("absent")}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/20 active:scale-95 cursor-pointer"
            >
              <X className="size-3.5" /> Absent
            </button>
          </div>

        </div>

        {/* Info showing matching count */}
        <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/5 pt-3">
          <p>
            Showing <span className="font-semibold text-white">{filteredWorkers.length}</span> of <span className="font-semibold text-white">{workers.length}</span> workers
          </p>
          {(searchTerm || roleFilter !== "All" || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("All");
                setStatusFilter("All");
              }}
              className="text-amber-200 hover:text-amber-100 font-medium transition cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Workers Attendance Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filteredWorkers.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-white/1 p-10 text-center text-slate-400">
            <Layers className="size-8 mx-auto text-slate-500 mb-3" />
            <p className="font-medium text-white">No workers found</p>
            <p className="text-sm mt-1">Try adjusting your search query or filters</p>
          </div>
        ) : (
          filteredWorkers.map((worker) => {
            const currentStatus = attendance[worker._id];

            // Dynamic theme variables based on status
            const theme = {
              present: {
                borderClass: "border-emerald-500/25 hover:border-emerald-500/40 focus-within:border-emerald-500/40",
                bgClass: "bg-emerald-950/20",
                glowClass: "shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]",
                badgeClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                avatarClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                badgeText: "Present",
                badgeIcon: Check,
              },
              half: {
                borderClass: "border-amber-500/25 hover:border-amber-500/40 focus-within:border-amber-500/40",
                bgClass: "bg-amber-950/20",
                glowClass: "shadow-[0_0_20px_-5px_rgba(245,158,11,0.1)]",
                badgeClass: "bg-amber-500/10 border-amber-500/20 text-amber-400",
                avatarClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
                badgeText: "Half Day",
                badgeIcon: Clock,
              },
              absent: {
                borderClass: "border-rose-500/25 hover:border-rose-500/40 focus-within:border-rose-500/40",
                bgClass: "bg-rose-950/20",
                glowClass: "shadow-[0_0_20px_-5px_rgba(239,68,68,0.1)]",
                badgeClass: "bg-rose-500/10 border-rose-500/20 text-rose-400",
                avatarClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
                badgeText: "Absent",
                badgeIcon: X,
              }
            }[currentStatus];

            return (
              <div
                key={worker._id}
                className={`relative flex flex-col justify-between rounded-3xl border p-5 transition-all duration-300 ${theme.borderClass} ${theme.bgClass} ${theme.glowClass} group`}
              >
                {/* Form Data Hooks */}
                <input type="hidden" name="workerIds" value={worker._id} />
                <input type="hidden" name={`status-${worker._id}`} value={currentStatus} />

                {/* Card Header & Body */}
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border font-semibold transition-all duration-300 ${theme.avatarClass} group-hover:scale-105`}>
                    {worker.name
                      .split(" ")
                      .map((part: string) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>

                  {/* Worker Details */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-base font-bold text-white leading-tight group-hover:text-amber-200 transition-colors duration-200">
                        {worker.name}
                      </p>

                      {/* Status Indicator Badge */}
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${theme.badgeClass}`}>
                        <theme.badgeIcon className="size-3" />
                        {theme.badgeText}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-300">{worker.role}</p>

                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <PhoneCall className="size-3.5 text-slate-500" />
                        {worker.phoneNumber}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5 text-slate-500" />
                        Joined {formatDate(worker.joiningDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="mt-5 border-t border-white/5 pt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 block mb-2">
                    Mark Status
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {/* Present Button */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker._id, "present")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${currentStatus === "present"
                        ? "bg-emerald-500 text-slate-950 shadow-[0_4px_12px_-2px_rgba(16,185,129,0.3)] scale-100 font-bold"
                        : "bg-slate-950/40 border border-white/5 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/4"
                        }`}
                    >
                      <Check className="size-3.5" />
                      <span>Present</span>
                    </button>

                    {/* Half Day Button */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker._id, "half")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${currentStatus === "half"
                        ? "bg-amber-500 text-slate-950 shadow-[0_4px_12px_-2px_rgba(245,158,11,0.3)] scale-100 font-bold"
                        : "bg-slate-950/40 border border-white/5 text-slate-400 hover:text-amber-400 hover:border-amber-500/20 hover:bg-amber-500/4"
                        }`}
                    >
                      <Clock className="size-3.5" />
                      <span>Half Day</span>
                    </button>

                    {/* Absent Button */}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(worker._id, "absent")}
                      className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-1 text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${currentStatus === "absent"
                        ? "bg-rose-500 text-slate-950 shadow-[0_4px_12px_-2px_rgba(239,68,68,0.3)] scale-100 font-bold"
                        : "bg-slate-950/40 border border-white/5 text-slate-400 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/4"
                        }`}
                    >
                      <X className="size-3.5" />
                      <span>Absent</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
