"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface Step5Props {
  data: any;
  availableChildren: any[];
  onEdit: (step: number) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const TOP_MATCHES = [
  { 
    name: "Sarah ***", 
    rating: 4.9, 
    bio: "Certified Newborn Care Specialist...", 
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1976&auto=format&fit=crop" 
  },
  { 
    name: "Michael ***", 
    rating: 5.0, 
    bio: "Former elementary teacher...", 
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1974&auto=format&fit=crop" 
  },
  { 
    name: "Jess ***", 
    rating: 4.8, 
    bio: "Bilingual caregiver with extensive...", 
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop" 
  },
];

export default function Step5({ data, availableChildren, onEdit, onSubmit, onBack }: Step5Props) {
  const childCount = Number(data.childCount || 1);
  const weeklyRetainerNum = Number(data.retainerBudget || 500);

  // Commitment Math
  const isRetainer = data.hiringType === 'retainer';
  const hourlyRateNum = Number(data.minRate || data.maxRate || 25);
  const hoursPerWeekNum = Number(data.hoursPerWeek || 40);
  
  const weeklyTotal = isRetainer 
    ? weeklyRetainerNum 
    : (hourlyRateNum * hoursPerWeekNum);

  const dutiesDisplay = typeof data.duties === 'string' 
    ? data.duties 
    : (data.duties && Object.keys(data.duties).length > 0 
        ? Object.entries(data.duties).filter(([_, v]) => v).map(([k]) => k).join(", ")
        : "");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="lg:col-span-9 space-y-12">
        {/* Header Section */}
        <header>
          <div className="flex items-center gap-4 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm border border-tertiary-fixed-dim">
              <MaterialIcon name="star" className="text-sm" fill />
              Premium Performance Enabled
            </div>
            {data.isLive && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg shadow-emerald-500/20 animate-pulse">
                <MaterialIcon name="verified" className="text-sm" fill />
                Listing is Live
              </div>
            )}
          </div>
          <h1 className="text-5xl lg:text-7xl font-extrabold font-headline text-primary tracking-tighter italic leading-[1] mb-6">
            {data.isLive ? "Finalize" : "Review"} & <span className="text-secondary italic">{data.isLive ? "Confirm" : "Post Job"}</span>
          </h1>
          <p className="text-on-surface-variant text-lg max-w-xl font-medium opacity-60 italic leading-relaxed">
            {data.isLive 
              ? "Your job is now active. Review your details below and make any final adjustments to your briefing."
              : "Finalize the details of your household requirements to connect with our elite caregiver network."}
          </p>
        </header>

        <section className="space-y-10">
          {/* 1. Job Description & Duties */}
          <div className="bg-surface-container-lowest p-10 rounded-[3rem] shadow-2xl shadow-primary/5 border border-outline-variant/10 relative group border-l-[12px] border-primary overflow-hidden">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary/5 text-primary rounded-2xl flex items-center justify-center">
                    <MaterialIcon name="auto_stories" className="text-2xl" />
                 </div>
                 <h2 className="text-3xl font-black font-headline text-primary tracking-tight">Household Briefing</h2>
              </div>
              <button 
                onClick={() => onEdit(3)}
                className="text-secondary font-black text-xs flex items-center gap-2 hover:bg-secondary/5 px-4 py-2 rounded-full transition-all group/edit"
              >
                <MaterialIcon name="edit" className="text-sm transition-transform group-hover/edit:rotate-12" /> 
                Refine Brief
              </button>
            </div>
            
            <div className="space-y-6 relative z-10">
               <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 ml-2">General Overview</p>
                  <p className="text-on-surface-variant leading-relaxed text-xl italic font-medium opacity-80 pl-2">
                    "{data.description || "Routine is very important for our household. We need a reliable professional who can maintain a strict nap schedule, meal times, and a calm environment."}"
                  </p>
               </div>
               
               {dutiesDisplay && (
                  <div className="pt-6 border-t border-outline-variant/10 space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 ml-2">Daily Duties & Expectations</p>
                     <p className="text-on-surface-variant leading-relaxed text-base italic font-medium opacity-70 pl-2">
                       {dutiesDisplay}
                     </p>
                  </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 2. Family Dynamics */}
            <div className="bg-surface-container-low p-10 rounded-[3rem] border border-outline-variant/10 shadow-sm space-y-8 relative overflow-hidden group">
              <div className="flex justify-between items-start relative z-10">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg text-primary">
                       <MaterialIcon name="groups_3" fill />
                    </div>
                    <h2 className="text-xl font-black font-headline text-primary">Family Dynamics</h2>
                 </div>
                 <button onClick={() => onEdit(1)} className="text-secondary font-black text-[10px] uppercase tracking-widest hover:underline">Edit</button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-[1.5rem] border border-white shadow-sm">
                    <div className="w-10 h-10 flex items-center justify-center bg-primary/5 text-primary rounded-xl shrink-0">
                      <MaterialIcon name="child_care" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest opacity-40 leading-none mb-1">Household Size</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        {childCount <= 3 ? (
                          Array.from({ length: childCount }).map((_, i) => (
                            <MaterialIcon key={i} name="child_care" className="text-primary/60 text-lg" />
                          ))
                        ) : (
                          <>
                            <MaterialIcon name="child_care" className="text-primary/60 text-lg" />
                            <MaterialIcon name="child_care" className="text-primary/60 text-lg" />
                            <MaterialIcon name="child_care" className="text-primary/60 text-lg" />
                            <span className="text-primary font-black text-xs ml-1">& {childCount - 3} more</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-[1.5rem] border border-white shadow-sm">
                   <div className="w-10 h-10 flex items-center justify-center bg-primary/5 text-primary rounded-xl shrink-0">
                      <MaterialIcon name="calendar_month" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest opacity-40 leading-none mb-1">Launch Date</p>
                      <p className="text-primary font-bold text-sm italic">{data.startDate || "April 11, 2026"}</p>
                   </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white/60 rounded-[1.5rem] border border-white shadow-sm">
                   <div className="w-10 h-10 flex items-center justify-center bg-primary/5 text-primary rounded-xl shrink-0">
                      <MaterialIcon name="location_on" fill />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest opacity-40 leading-none mb-1">Base Location</p>
                      <p className="text-primary font-bold text-sm truncate italic">{data.location || "Cedar Falls, Iowa 50613"}</p>
                   </div>
                </div>
              </div>
            </div>

            {/* 3. Pay Scale */}
            <div className="bg-surface-container-lowest p-10 rounded-[3rem] border border-outline-variant/10 shadow-2xl shadow-primary/5 flex flex-col justify-between group relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center shadow-lg text-secondary">
                          <MaterialIcon name="payments" fill />
                       </div>
                       <h2 className="text-xl font-black font-headline text-primary">Pay Scale</h2>
                    </div>
                    <button onClick={() => onEdit(2)} className="text-secondary font-black text-[10px] uppercase tracking-widest hover:underline">Edit</button>
                  </div>

                  <div className="mb-8">
                    {isRetainer ? (
                       <div className="space-y-2">
                          <div className="text-6xl font-black text-primary tracking-tighter italic">${weeklyRetainerNum}<span className="text-lg font-medium text-on-surface-variant ml-1 opacity-40">/wk</span></div>
                          <div className="inline-block px-4 py-1.5 bg-secondary-fixed text-on-secondary-fixed rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">Recurring Retainer</div>
                       </div>
                    ) : (
                       <div className="space-y-2">
                          <div className="text-5xl font-black text-primary tracking-tighter italic">${hourlyRateNum}<span className="text-lg font-medium text-on-surface-variant ml-1 opacity-40">/hr</span></div>
                          <div className="inline-block px-4 py-1.5 bg-primary-fixed text-on-primary-fixed rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm italic">Standard Hourly</div>
                       </div>
                    )}
                  </div>
                  <p className="text-on-surface-variant text-xs leading-relaxed font-medium opacity-60 italic mb-6">
                    {isRetainer 
                       ? "Retainers prioritize consistent weekly capacity and shared household management over rigid hourly blocks. Best for elite, high-commitment roles."
                       : "Transparent market rates tailored to your local neighborhood and caregiver experience level. Perfect for focused, session-based support."}
                  </p>
               </div>
            </div>
          </div>
          {/* 4. Prerequisites & Mandatory Certifications */}
          <div className="md:w-3/5 space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm border border-emerald-100">
                <MaterialIcon name="verified_user" className="text-xl" fill />
              </div>
              <h2 className="text-xl font-black font-headline text-primary tracking-tight italic uppercase opacity-80">Prerequisites & Certifications</h2>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {/* Fixed Platform Prerequisites */}
               <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <MaterialIcon name="check" className="text-sm" />
                    </div>
                    <span className="text-sm font-bold text-primary italic opacity-70">Multi-Step Identity Verification</span>
                  </div>
                  <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest px-3 py-1 bg-emerald-50 rounded-lg">Mandatory</div>
               </div>

               <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm group hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <MaterialIcon name="check" className="text-sm" />
                    </div>
                    <span className="text-sm font-bold text-primary italic opacity-70">Background Check Clearance</span>
                  </div>
                  <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest px-3 py-1 bg-emerald-50 rounded-lg">Mandatory</div>
               </div>

               {/* Dynamic User-Selected Certs */}
               {data.certs?.cpr && (
                 <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                        <MaterialIcon name="ecg_heart" className="text-sm" />
                      </div>
                      <span className="text-sm font-bold text-primary italic">Active CPR Certification</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-secondary tracking-widest px-3 py-1 bg-secondary/5 rounded-lg">Required</div>
                 </div>
               )}

               {data.certs?.first_aid && (
                 <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
                        <MaterialIcon name="medical_services" className="text-sm" />
                      </div>
                      <span className="text-sm font-bold text-primary italic">Standard First Aid</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-secondary tracking-widest px-3 py-1 bg-secondary/5 rounded-lg">Required</div>
               </div>
               )}

               {data.language && (
                 <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-outline-variant/10 shadow-sm group hover:border-primary/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center">
                        <MaterialIcon name="language" className="text-sm" />
                      </div>
                      <span className="text-sm font-bold text-primary italic">Fluency in {data.language}</span>
                    </div>
                    <div className="text-[10px] font-black uppercase text-primary tracking-widest px-3 py-1 bg-primary/5 rounded-lg opacity-40 italic">Preferred</div>
                 </div>
               )}
            </div>
          </div>

          <div className="flex items-center justify-between p-8 bg-primary text-white rounded-[2.5rem] shadow-2xl shadow-primary/30 group relative overflow-hidden">
            <div className="flex items-center gap-8 animate-in slide-in-from-left duration-700 relative z-10">
              <div className="flex -space-x-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:-translate-y-1 transition-transform">
                   <MaterialIcon name="gpp_good" fill />
                </div>
                <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:-translate-y-1 transition-transform">
                   <MaterialIcon name="verified" fill />
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 hover:-translate-y-1 transition-transform">
                   <MaterialIcon name="security" fill />
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] mb-1">Trust & Safety</p>
                <p className="font-headline text-xl font-black italic">Multi-Tier Security Clearance Active</p>
              </div>
            </div>
            <MaterialIcon name="lock" className="opacity-20 text-3xl group-hover:rotate-12 transition-transform duration-700 relative z-10" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-[100px] -z-0 translate-x-40 -translate-y-40"></div>
          </div>
        </section>
      </div>

      <div className="lg:col-span-3 space-y-8">
        <div className="sticky top-28 space-y-8">
          {/* Summary Card with Post Button */}
          <div className="bg-primary p-10 rounded-[3rem] text-white shadow-2xl shadow-primary/20 overflow-hidden relative group">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-secondary-fixed mb-8">
                <MaterialIcon name="payments" className="text-xl" fill />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Financial Commitment</span>
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="flex justify-between items-baseline border-b border-white/10 pb-4">
                  <span className="text-xs font-medium opacity-60">Weekly Rate</span>
                  <span className="text-2xl font-black italic tracking-tighter">${weeklyTotal.toFixed(2)}</span>
                </div>
                {!isRetainer && (
                  <div className="flex justify-between text-[10px] font-bold text-white/40 uppercase tracking-widest -mt-4">
                    <span>Breakdown</span>
                    <span>${hourlyRateNum}/hr × {hoursPerWeekNum}hrs</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium opacity-60">Listing Fee</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase rounded border border-emerald-500/20 tracking-widest">Included</span>
                </div>
              </div>

              <div className="mb-10 text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 mb-1 leading-none">Total Commitment</p>
                <div className="text-4xl font-black italic tracking-tighter">${weeklyTotal.toFixed(2)}</div>
                <p className="text-[10px] font-medium opacity-40 mt-1 uppercase tracking-widest">per week (Escrow Protected)</p>
              </div>
              
              <button 
                onClick={onSubmit}
                className="w-full py-6 bg-secondary text-primary font-black rounded-3xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 group/post"
              >
                 {data.isLive ? "Finish & View Dashboard" : "Post Job to Kindred Circle"}
                 <MaterialIcon name="arrow_forward" className="group-hover/post:translate-x-2 transition-transform" />
              </button>
              <p className="mt-6 text-[9px] text-center text-primary-fixed/20 uppercase tracking-[0.4em] font-black">Priority Placement Active</p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-outline-variant/10 shadow-sm shadow-primary/5">
             <div className="flex items-center gap-3 text-primary mb-4 opacity-40">
                <MaterialIcon name="verified" className="text-sm" />
                <p className="text-[9px] font-black uppercase tracking-widest">Final Terms Review</p>
             </div>
             <p className="text-xs font-medium text-on-surface-variant leading-relaxed opacity-60 italic">
                By posting, you agree to the Kindred Circle escrow terms. Funds are held securely until session completion.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
