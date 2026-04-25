"use client";

import { useState, Fragment } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { updateUserRole, resendReferenceEmail } from "../actions";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  verification?: any;
  references?: any[];
}

interface CaregiversClientProps {
  initialData: {
    users: User[];
    total: number;
    page: number;
    totalPages: number;
  };
  search: string;
  role: string;
  page: number;
}

export default function CaregiversClient({ initialData, search: initialSearch, role: initialRole, page: initialPage }: CaregiversClientProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  const handleResend = async (refId: string) => {
    setResending(refId);
    try {
      const res = await resendReferenceEmail(refId);
      if (res.success) {
        showToast("Reference request re-queued for delivery.", "success");
      } else {
        showToast("Relay rejected the resend request.", "error");
      }
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Resend failed", "error");
    } finally {
      setResending(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
// ... (rest of the handleRoleChange logic stays same)
    if (!confirm(`Confirm role elevation/demotion to "${newRole}"?`)) return;
    setUpdating(userId);
    try {
      await updateUserRole(userId, newRole as any);
      showToast("Security privileges updated.", "success");
      router.refresh();
    } catch (e: any) {
      showToast(e.message || "Failed to update role", "error");
    } finally {
      setUpdating(null);
    }
  };

  const updateFilters = (newParams: Record<string, string> = {}) => {
    const url = new URL(window.location.href);
    if (newParams) {
      Object.entries(newParams).forEach(([key, val]) => {
        if (val) url.searchParams.set(key, val);
        else url.searchParams.delete(key);
      });
    }
    router.push(url.pathname + url.search);
  };

  return (
    <div className="space-y-6">
      {/* Table Filters & Tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl inline-flex gap-1 mb-6">
        <button 
          onClick={() => updateFilters({ role: "" })}
          className={cn(
            "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
            !initialRole ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          All Users
        </button>
        <button 
          onClick={() => updateFilters({ role: "caregiver" })}
          className={cn(
            "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
            initialRole === "caregiver" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Nannies Only
        </button>
        <button 
          onClick={() => updateFilters({ role: "parent" })}
          className={cn(
            "px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
            initialRole === "parent" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          Families Only
        </button>
      </div>

      <div className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-slate-100">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div className="relative group">
            <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search community..." 
              defaultValue={initialSearch}
              onKeyDown={(e) => e.key === "Enter" && updateFilters({ search: e.currentTarget.value })}
              className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-xs w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none italic"
            />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Showing {initialData.users.length} entities</p>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">User Identity</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">System Role</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Verification</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Joined Date</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {initialData.users.map((u) => (
              <Fragment key={u.id}>
              <tr className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img 
                      src={`https://api.dicebear.com/7.x/initials/svg?seed=${u.fullName}`} 
                      alt={u.fullName} 
                      className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm ring-2 ring-primary/5"
                    />
                    <div>
                      <p className="text-sm font-bold text-primary italic leading-none">{u.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-1.5">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    u.role === "caregiver" ? "bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim" :
                    u.role === "parent" ? "bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim" :
                    "bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim"
                  )}>
                    {u.role}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-2">
                    <MaterialIcon name={u.verification?.status === "verified" ? "verified" : u.verification?.status === "pending" ? "pending_actions" : "info"} className={cn("text-lg", u.verification?.status === "verified" ? "text-emerald-500" : u.verification?.status === "pending" ? "text-amber-500" : "text-slate-300")} fill={u.verification?.status === "verified"} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      {u.verification?.status || "none"}
                    </span>
                  </div>
                </td>
                <td className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end items-center gap-3">
                    {u.role === "caregiver" && (
                      <button 
                        onClick={() => setExpandedRow(expandedRow === u.id ? null : u.id)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                          expandedRow === u.id ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
                        )}
                      >
                        Vetting Dossier
                      </button>
                    )}
                    <select
                      value={u.role}
                      disabled={updating === u.id || u.role === "admin"}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="px-4 py-2 bg-slate-100 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:opacity-30"
                    >
                      <option value="parent">Make Parent</option>
                      <option value="caregiver">Make Caregiver</option>
                      <option value="moderator">Make Moderator</option>
                    </select>
                  </div>
                </td>
              </tr>
              {expandedRow === u.id && u.role === "caregiver" && (
                <tr className="bg-slate-50/80">
                  <td colSpan={5} className="px-12 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                          <MaterialIcon name="how_to_reg" className="text-sm" />
                          Verification Assets
                        </h5>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identity Photos</span>
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest">{u.verification?.idFrontUrl ? "COLLECTED" : "MISSING"}</span>
                          </div>
                          <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SSN / Background Auth</span>
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest">{u.verification?.backgroundAuth ? "AUTHORIZED" : "PENDING"}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-black text-primary uppercase tracking-widest mb-6 flex items-center gap-2">
                          <MaterialIcon name="contact_mail" className="text-sm" />
                          Reference Automations
                        </h5>
                        <div className="space-y-3">
                          {u.references?.length === 0 ? (
                            <p className="text-[10px] italic text-slate-400 font-bold uppercase tracking-widest">No references submitted yet.</p>
                          ) : u.references?.map((ref) => (
                            <div key={ref.id} className="p-5 bg-white rounded-2xl border border-slate-100 flex justify-between items-center group/ref shadow-sm">
                              <div>
                                <p className="text-[11px] font-black text-primary italic">{ref.employerName}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{ref.employerEmail}</p>
                                <div className="flex items-center gap-2 mt-3">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full animate-pulse",
                                    ref.emailStatus === "sent" ? "bg-emerald-400" : ref.emailStatus === "failed" ? "bg-red-400" : "bg-amber-400"
                                  )} />
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-widest",
                                    ref.emailStatus === "sent" ? "text-emerald-600" : ref.emailStatus === "failed" ? "text-red-600" : "text-amber-600"
                                  )}>
                                    Email {ref.emailStatus}
                                  </span>
                                  {ref.lastEmailSentAt && (
                                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest ml-2">
                                      {new Date(ref.lastEmailSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={() => handleResend(ref.id)}
                                disabled={resending === ref.id}
                                className="px-4 py-2 bg-slate-50 text-primary rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-100 hover:bg-primary hover:text-white transition-all disabled:opacity-30"
                              >
                                {resending === ref.id ? "Sending..." : "Resend"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {initialData.totalPages > 1 && (
          <div className="px-8 py-6 bg-slate-50/50 flex items-center justify-between border-t border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Showing page {initialPage} of {initialData.totalPages}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => updateFilters({ page: (initialPage - 1).toString() })}
                disabled={initialPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <MaterialIcon name="chevron_left" className="text-sm" />
              </button>
              {[...Array(initialData.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => updateFilters({ page: (i + 1).toString() })}
                  className={cn(
                    "w-8 h-8 rounded-xl font-black text-[10px] transition-all",
                    initialPage === i + 1 ? "bg-primary text-white shadow-lg" : "hover:bg-slate-100 text-slate-500"
                  )}
                >
                  {i + 1}
                </button>
              ))}
              <button 
                onClick={() => updateFilters({ page: (initialPage + 1).toString() })}
                disabled={initialPage === initialData.totalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <MaterialIcon name="chevron_right" className="text-sm" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contextual Insight */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 bg-gradient-to-r from-[#1d3557] to-[#031f41] p-10 rounded-[2.5rem] text-white flex justify-between items-center relative overflow-hidden group shadow-2xl shadow-primary/20">
          <div className="relative z-10 max-w-sm">
            <h4 className="text-2xl font-headline font-black mb-3 leading-tight italic tracking-tight">Security Integrity Analysis</h4>
            <p className="text-primary-fixed-dim text-[11px] font-bold uppercase tracking-wider mb-6 opacity-60">Level 3 verified users are 85% more likely to secure repeat bookings according to our node-based safety heuristics.</p>
            <button className="bg-secondary-fixed text-on-secondary-fixed px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform shadow-lg">View Security Report</button>
          </div>
          <div className="relative z-10 hidden md:block">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-[2.5rem] border border-white/20 flex items-center justify-center shadow-inner">
              <MaterialIcon name="shield_with_heart" className="text-5xl text-white opacity-80" />
            </div>
          </div>
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
        </div>
        
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <MaterialIcon name="history" className="text-primary" />
            <h4 className="text-sm font-black text-primary uppercase tracking-widest italic">Access Control Logs</h4>
          </div>
          <ul className="space-y-6 flex-1">
            <li className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
              <div>
                <p className="text-[11px] font-black text-primary leading-none uppercase tracking-tight">Role Elevation</p>
                <p className="text-[10px] text-slate-500 mt-1.5 font-bold leading-relaxed uppercase tracking-widest">Admin upgraded user ID #4920 to Senior Caregiver status.</p>
                <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-black italic tracking-widest">14 mins ago</p>
              </div>
            </li>
            <li className="flex gap-4 opacity-70">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5"></div>
              <div>
                <p className="text-[11px] font-black text-primary leading-none uppercase tracking-tight">Identity Check</p>
                <p className="text-[10px] text-slate-500 mt-1.5 font-bold leading-relaxed uppercase tracking-widest">Automatic biometric verification pass for Sarah J.</p>
                <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-black italic tracking-widest">1 hour ago</p>
              </div>
            </li>
          </ul>
          <button className="w-full mt-6 py-3 border-t border-slate-200 text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:text-secondary hover:translate-x-1 transition-all text-left">Full Audit Trail →</button>
        </div>
      </div>
    </div>
  );
}
