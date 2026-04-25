"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface VisibilityStripProps {
  isVerified: boolean;
  verificationStatus: "none" | "draft" | "pending" | "verified" | "rejected";
  missingFields: string[];
  enrolledInStandards?: boolean;
  isPremium?: boolean;
}

export function VisibilityStrip({ isVerified, verificationStatus, missingFields, enrolledInStandards, isPremium }: VisibilityStripProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // 1. Determine State
  const effectiveIsVerified = isVerified || verificationStatus === "verified";
  const isPending = verificationStatus === "pending";
  const isIncomplete = missingFields.length > 0;
  const isEnrolledNotPassed = enrolledInStandards && !isPremium;
  const isLive = effectiveIsVerified && !isIncomplete && !isEnrolledNotPassed;

  if (isLive) return null;

  // 2. Determine Message & Style
  let message = "Profile Visibility Restricted: Identity Verification Required";
  let bgColor = "bg-rose-500";
  let icon = "lock";
  let actionText = "Why?";
  let onAction = () => setIsModalOpen(true);

  if (isPending) {
    message = "Verification Pending: Finalizing Safety Clearances";
    bgColor = "bg-amber-500";
    icon = "history";
  } else if (!effectiveIsVerified) {
    message = "Marketplace Access Restricted: Identity Verification Required";
    bgColor = "bg-rose-600";
    icon = "verified_user";
  } else if (isIncomplete) {
    const fieldSummary = missingFields.length === 1 
        ? missingFields[0] 
        : `${missingFields[0]} & ${missingFields.length - 1} more`;
    message = `Profile Hidden: ${fieldSummary} Missing`;
    bgColor = "bg-slate-700";
    icon = "visibility_off";
  } else if (isEnrolledNotPassed) {
    message = "Professional Hub: Standards Exam Required for Elite Badge";
    bgColor = "bg-gradient-to-r from-indigo-600 to-violet-600";
    icon = "school";
    actionText = "Enter Academy";
    onAction = () => router.push("/dashboard/nanny/certifications");
  }

  return (
    <>
      <div className={cn(
        "relative overflow-hidden px-6 py-3 text-white shadow-lg flex items-center justify-between gap-4 transition-all duration-500 animate-in slide-in-from-top-full",
        bgColor
      )}>
        <div className="flex items-center gap-3">
          <MaterialIcon name={icon} className="text-xl shrink-0" fill />
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] leading-none mb-0.5 opacity-80">Marketplace Status</p>
            <p className="text-xs font-bold tracking-tight">{message}</p>
          </div>
        </div>

        <button
          onClick={onAction}
          className="px-4 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/20 whitespace-nowrap"
        >
          {actionText}
        </button>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* Why Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary">
                <MaterialIcon name="info" className="text-2xl" fill />
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-full hover:bg-slate-50 flex items-center justify-center text-slate-400"
              >
                <MaterialIcon name="close" />
              </button>
            </div>

            <h3 className="text-2xl font-headline font-black text-primary italic tracking-tight mb-4">Marketplace Visibility</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              To maintain premium standards, your profile is functionally hidden from families until all criteria are satisfied.
            </p>

            <div className="space-y-4">
              {/* Verification Status */}
              {!effectiveIsVerified && (
                <Link href="/dashboard/nanny/verification" className="block text-inherit">
                  <div className={cn(
                    "p-4 rounded-2xl flex items-center gap-4 border group hover:border-amber-200 hover:bg-amber-50/30 transition-all",
                    isPending ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100"
                  )}>
                    <MaterialIcon 
                      name={effectiveIsVerified ? "verified" : (isPending ? "history" : "cancel")} 
                      className={cn("text-xl", effectiveIsVerified ? "text-emerald-500" : (isPending ? "text-amber-500" : "text-rose-500"))} 
                      fill 
                    />
                    <div className="flex-grow">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Identity Check</p>
                      <p className={cn("text-xs font-bold", effectiveIsVerified ? "text-emerald-700" : (isPending ? "text-amber-700" : "text-rose-700"))}>
                        {effectiveIsVerified ? "Vetted & Verified" : (isPending ? "Under Review" : "Action Required")}
                      </p>
                    </div>
                    <MaterialIcon name="chevron_right" className="text-slate-300 group-hover:text-amber-400" />
                  </div>
                </Link>
              )}

              {/* Missing Fields List */}
              {missingFields.length > 0 && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Missing Professional Assets</p>
                   <ul className="space-y-3">
                      {missingFields.map((field, idx) => (
                        <li key={idx} className="flex items-center justify-between group">
                          <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600">
                             <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                             {field}
                          </div>
                          <Link 
                            href="/dashboard/nanny/profile" 
                            className="text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
                          >
                            Fix Now
                          </Link>
                        </li>
                      ))}
                   </ul>
                </div>
              )}

              {isEnrolledNotPassed && !isIncomplete && isVerified && (
                  <Link href="/dashboard/nanny/certifications" className="block p-4 bg-indigo-50 border border-indigo-100 rounded-2xl group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white">
                            <MaterialIcon name="school" className="text-xl" />
                        </div>
                        <div className="flex-grow">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 leading-none mb-1">Elite Status</p>
                            <p className="text-xs font-bold text-indigo-900">Finish Global Care Exam</p>
                        </div>
                        <MaterialIcon name="arrow_forward" className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                      </div>
                  </Link>
              )}
            </div>

            <button
              onClick={() => setIsModalOpen(false)}
              className="w-full py-4 mt-8 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Close Hub
            </button>
          </div>
        </div>
      )}
    </>
  );
}
