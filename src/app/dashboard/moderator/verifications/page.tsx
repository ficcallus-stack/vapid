"use client";

import { useEffect, useState } from "react";
import { getVerificationStats, getVerificationsList } from "./actions";
import { MaterialIcon } from "@/components/MaterialIcon";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function ModeratorVerificationsPage() {
  const [status, setStatus] = useState<"pending" | "verified" | "rejected">("pending");
  const [sort, setSort] = useState<"recent" | "earliest">("recent");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handler = setTimeout(async () => {
      setLoading(true);
      try {
        const [s, l] = await Promise.all([
          getVerificationStats(),
          getVerificationsList({ status, sort, search })
        ]);
        setStats(s);
        setList(l);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [status, sort, search]);

  return (
    <div className="bg-surface min-h-screen pb-20">
      <header className="mb-12">
        <h1 className="text-4xl font-headline font-black text-primary italic tracking-tighter mb-4">Security Dispatch.</h1>
        <p className="text-on-surface-variant/60 font-medium italic text-sm">Reviewing identity and professional vetting dossiers.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Pending", value: stats?.pending ?? 0, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Verified", value: stats?.verified ?? 0, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Rejected", value: stats?.rejected ?? 0, color: "text-red-600", bg: "bg-red-50" },
          { label: "Total Load", value: stats?.total ?? 0, color: "text-primary", bg: "bg-slate-100" }
        ].map((stat, i) => (
          <div key={i} className={cn("p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm", stat.bg)}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">{stat.label}</p>
            <p className={cn("text-4xl font-headline font-black italic tracking-tighter leading-none", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
        <div className="flex items-center gap-6 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors">
                <MaterialIcon name="person_search" />
             </div>
             <input 
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search by name or email..."
               className="w-full bg-white border border-outline-variant/10 pl-16 pr-6 py-4 rounded-[1.5rem] text-xs font-bold text-primary shadow-sm focus:ring-4 ring-primary/5 outline-none transition-all placeholder:text-on-surface-variant/20 italic"
             />
          </div>

          <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-sm border border-outline-variant/5 shrink-0">
          {(["pending", "verified", "rejected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={cn(
                "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                status === s ? "bg-primary text-white shadow-lg" : "text-on-surface-variant hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/40 italic">Sort By</span>
          <select 
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-white border border-outline-variant/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary shadow-sm focus:ring-4 ring-primary/5 outline-none appearance-none"
          >
            <option value="recent">Recent First</option>
            <option value="earliest">Earliest First</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <MaterialIcon name="sync" className="animate-spin text-primary/20 text-4xl" />
          </div>
        ) : list.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-outline-variant/20">
            <p className="text-on-surface-variant/40 font-bold italic">No dossiers in this queue.</p>
          </div>
        ) : (
          list.map((item) => (
            <Link 
              key={item.id} 
              href={`/dashboard/moderator/verifications/${item.id}`}
              className="flex flex-col md:flex-row items-center justify-between p-6 bg-white rounded-[2rem] border border-outline-variant/5 hover:border-primary/20 hover:shadow-xl transition-all group"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <MaterialIcon name="person" fill={status === 'verified'} />
                </div>
                <div>
                  <h3 className="font-headline font-black text-primary italic tracking-tight leading-none mb-2">{item.userName}</h3>
                  <p className="text-xs font-medium text-on-surface-variant/40">{item.userEmail}</p>
                </div>
              </div>

              <div className="flex items-center gap-12 mt-4 md:mt-0">
                <div className="text-right">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1 leading-none italic">Submitted</p>
                  <p className="text-xs font-bold text-primary italic">{format(new Date(item.updatedAt), "MMM d, h:mm a")}</p>
                </div>

                {status !== 'pending' && (
                  <div className="text-right border-l border-outline-variant/10 pl-12">
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-1 leading-none italic">
                      {status === 'verified' ? 'Verified By' : 'Rejected By'}
                    </p>
                    <p className="text-xs font-bold text-primary italic">{item.moderatorName || "System"}</p>
                  </div>
                )}

                <div className="w-10 h-10 rounded-full flex items-center justify-center text-primary/20 group-hover:text-primary transition-colors">
                   <MaterialIcon name="arrow_forward" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
