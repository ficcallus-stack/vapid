"use client";

import React, { use, useEffect, useState } from "react";
import { getVerificationDetail, processVerification } from "../actions";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Clock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";

export default function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSsn, setShowSsn] = useState(false);
  const [notes, setNotes] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const d = await getVerificationDetail(id);
        setData(d);
        setNotes(d?.adminNotes || "");
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function handleAction(action: "verify" | "reject") {
    if (action === "reject" && !notes) {
      alert("Please provide notes for rejection.");
      return;
    }
    
    setIsProcessing(true);
    try {
      await processVerification(id, action, notes);
      router.refresh();
      const d = await getVerificationDetail(id);
      setData(d);
    } catch (e) {
      console.error(e);
      alert("Failed to process action.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="py-40 flex items-center justify-center">
        <Loader2 className="animate-spin text-primary opacity-20" size={48} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-40 text-center">
        <p className="text-on-surface-variant font-bold italic">Dossier not found.</p>
        <button onClick={() => router.back()} className="mt-8 text-primary font-black uppercase tracking-widest text-[10px] italic underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="bg-surface min-h-screen pb-40">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-outline-variant/10 hover:bg-slate-50 transition-all">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-headline font-black text-primary italic tracking-tighter leading-none">{data.user.fullName}</h1>
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border",
                data.status === 'verified' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                data.status === 'rejected' ? "bg-red-50 text-red-700 border-red-100" :
                "bg-amber-50 text-amber-700 border-amber-100"
              )}>
                {data.status}
              </div>
            </div>
            <p className="text-on-surface-variant/60 font-medium italic text-sm">{data.user.email}</p>
          </div>
        </div>

        {data.status === 'pending' && (
          <div className="flex items-center gap-4 bg-white/60 backdrop-blur-xl p-4 rounded-3xl border border-white/20 shadow-xl">
             <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-2xl cursor-pointer hover:brightness-95 transition-all" onClick={() => handleAction("verify")}>
                <ShieldCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Approve Dossier</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-2xl cursor-pointer hover:brightness-95 transition-all" onClick={() => handleAction("reject")}>
                <ShieldAlert size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Decline & Request Fix</span>
             </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Visual Assets */}
        <div className="lg:col-span-8 space-y-12">
          <section className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
              <MaterialIcon name="image" className="text-primary text-2xl" />
              <h2 className="text-2xl font-headline font-black text-primary italic tracking-tight">Identity Assets.</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 italic ml-4">ID Front Scan</p>
                <div className="aspect-[1.6/1] bg-white rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden group">
                  <img src={data.idFrontUrl} alt="ID Front" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 italic ml-4">ID Back Scan</p>
                <div className="aspect-[1.6/1] bg-white rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden group">
                  <img src={data.idBackUrl} alt="ID Back" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                </div>
              </div>
            </div>

            <div className="pt-8 space-y-4 max-w-lg mx-auto w-full">
               <p className="text-[10px] font-black uppercase tracking-widest text-primary/40 italic text-center">Live Verification Video</p>
               <div className="aspect-video bg-black rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden group relative">
                  <video 
                    src={`${data.selfieUrl}#t=0.1`} 
                    controls 
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  />
               </div>
            </div>
          </section>

          <section className="pt-12 border-t border-outline-variant/10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <MaterialIcon name="verified_user" className="text-primary text-2xl" />
                <h2 className="text-2xl font-headline font-black text-primary italic tracking-tight">Trust Automation.</h2>
              </div>
              <div className="px-4 py-2 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">Reference Quorum: {data.submissions?.filter((r: any) => r.status === 'completed').length || 0}/3</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {(!data.submissions || data.submissions.length === 0) && (!data.references || data.references.length === 0) ? (
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-outline-variant/20 text-center">
                    <p className="text-on-surface-variant/40 font-bold italic">No references found in this dossier.</p>
                 </div>
              ) : (!data.submissions || data.submissions.length === 0) ? (
                 /* Fallback for Legacy/Manual JSONB data */
                 <div className="space-y-4">
                    <div className="px-8 py-4 bg-amber-50 border border-amber-100 rounded-3xl mb-4">
                       <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 italic">Manual Reference List (Pre-Automation)</p>
                    </div>
                    {data.references.map((ref: any, i: number) => (
                      <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-outline-variant/5 shadow-sm space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black italic">{i+1}</div>
                          <div>
                            <p className="text-sm font-black text-primary italic leading-none mb-1">{ref.name}</p>
                            <p className="text-xs font-medium text-on-surface-variant/40">{ref.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              ) : data.submissions?.map((ref: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-[3rem] border border-outline-variant/5 shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black italic text-xl shadow-lg shadow-primary/20">{ref.employerName[0] || "?"}</div>
                      <div>
                        <p className="text-sm font-black text-primary italic leading-none mb-1">{ref.employerName}</p>
                        <p className="text-xs font-medium text-on-surface-variant/40">{ref.employerEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                        ref.emailStatus === 'sent' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        ref.emailStatus === 'failed' ? "bg-red-50 text-red-700 border-red-100" :
                        "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                        Email: {ref.emailStatus}
                      </div>
                      <div className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest italic border",
                        ref.status === 'completed' ? "bg-emerald-500 text-white border-emerald-600" : "bg-white text-on-surface-variant/40 border-outline-variant/20"
                      )}>
                        Feedback: {ref.status}
                      </div>
                    </div>
                  </div>

                  {ref.status === 'completed' ? (
                    <div className="bg-slate-50 rounded-[2rem] p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <MaterialIcon 
                            key={star} 
                            name="star" 
                            className={cn("text-lg", star <= (ref.rating || 0) ? "text-amber-400" : "text-slate-200")} 
                          />
                        ))}
                        <span className="text-[10px] font-black text-primary italic ml-2">Rating: {ref.rating}/5</span>
                      </div>
                      <p className="text-sm font-medium italic text-on-surface-variant leading-relaxed">
                        "{ref.comment || "No written comment provided."}"
                      </p>
                      {ref.verifiedAt && (
                        <p className="text-[9px] font-black uppercase tracking-widest text-primary/30 italic">
                          Verified via token handshake on {new Date(ref.verifiedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 px-6 border border-dashed border-outline-variant/20 rounded-2xl">
                       <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/20 italic">Awaiting response from employer...</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Details & Action */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-primary text-white p-10 rounded-[3.5rem] shadow-2xl shadow-primary/20 space-y-8 relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 italic">Background Check Details</p>
                <div className="space-y-6">
                   <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1 leading-none italic">Social Security Number</p>
                      <div className="flex items-center gap-4">
                        <p className={cn(
                          "text-2xl font-black italic",
                          showSsn ? "tracking-widest" : "tracking-[0.2em]"
                        )}>
                          {showSsn ? data.ssn : "***-**-****"}
                        </p>
                        <button 
                          onClick={() => setShowSsn(!showSsn)}
                          className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
                        >
                          <MaterialIcon name={showSsn ? "visibility_off" : "visibility"} className="text-sm" />
                        </button>
                      </div>
                      <p className="text-[10px] text-white/40 italic mt-1">
                        {showSsn ? "Full SSN revealed for background check" : "Masked for Privacy (Tap to reveal)"}
                      </p>
                   </div>
                   <div className="flex items-center gap-3 text-emerald-400">
                      <CheckCircle2 size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Auth Timestamp: {data.backgroundAuthTimestamp ? new Date(data.backgroundAuthTimestamp).toLocaleDateString() : 'N/A'}</span>
                   </div>
                </div>
             </div>
             <MaterialIcon name="security" className="absolute -bottom-10 -right-10 text-[12rem] text-white/5 -rotate-12" />
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-outline-variant/10 shadow-sm space-y-8">
             <h3 className="text-lg font-black text-primary italic tracking-tight leading-none mb-4">Decision Portal</h3>
             
             <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 italic ml-4">Administrative Notes</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Reason for rejection or verification notes..."
                  className="w-full bg-surface-container-low border-none rounded-[2rem] p-6 text-sm font-medium italic focus:ring-4 ring-primary/5 outline-none h-40 resize-none"
                  readOnly={data.status !== 'pending' && !isProcessing}
                />
             </div>

             {data.status === 'pending' && (
               <div className="grid grid-cols-1 gap-4">
                 <button 
                  disabled={isProcessing}
                  onClick={() => handleAction("verify")}
                  className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                 >
                   {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <ShieldCheck size={18} />}
                   Confirm Verification
                 </button>
                 <button 
                  disabled={isProcessing}
                  onClick={() => handleAction("reject")}
                  className="w-full bg-red-50 text-red-600 border border-red-100 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-red-100 transition-all flex items-center justify-center gap-3"
                 >
                   {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <ShieldAlert size={18} />}
                   Reject & Request Update
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
