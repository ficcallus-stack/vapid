"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface RatesStepProps {
  profile: any;
  handleUpdate: (field: string, value: any) => void;
}

export function RatesStep({ profile, handleUpdate }: RatesStepProps) {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <section className="bg-surface-container-lowest p-8 md:p-14 rounded-[4rem] shadow-xl border border-outline-variant/10 relative overflow-hidden group">
        <div className="relative z-10 space-y-12">
          <header className="max-w-xl">
             <h3 className="font-headline text-4xl font-black text-primary italic tracking-tighter mb-4 leading-none">Economics of Care</h3>
             <p className="text-on-surface-variant text-lg font-medium italic opacity-70 leading-relaxed">
               KindredCare facilitates elite placements. Your rates should reflect your mastery, certifications, and the bespoke nature of your service.
             </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Hourly Rate */}
            <div className="space-y-8 bg-surface-container-low/50 p-10 rounded-[3rem] border border-outline-variant/10 hover:border-primary/20 transition-all">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic opacity-60">Spot Hourly Rate</label>
                    <p className="text-[9px] text-on-surface-variant font-medium italic leading-none">Emergency or Date Night</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-black text-primary italic tracking-tighter">${profile.hourlyRate || "35"}</span>
                  <span className="text-sm font-black text-primary/40 italic ml-1">/HR</span>
                </div>
              </div>
              <input 
                type="range" min="20" max="150" step="1"
                className="w-full accent-primary h-2 bg-slate-200 rounded-full appearance-none cursor-pointer"
                value={profile.hourlyRate || 35}
                onChange={(e) => handleUpdate("hourlyRate", parseInt(e.target.value))}
              />
              <div className="flex items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-outline-variant/5">
                 <MaterialIcon name="info" className="text-primary/20 text-xl" />
                 <p className="text-[9px] font-medium text-on-surface-variant/60 italic leading-snug">
                   Market average for your area is <span className="font-black text-primary">$32 - $45/hr</span>. Adjust based on your specialized certifications.
                 </p>
              </div>
            </div>

            {/* Weekly Retainer */}
            <div className="space-y-8 bg-primary p-10 rounded-[3rem] shadow-2xl shadow-primary/20 relative overflow-hidden group/card">
              <div className="flex justify-between items-end relative z-10">
                <div className="space-y-1 text-white">
                    <span className="bg-white/20 text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-2 block border border-white/10 backdrop-blur-md">Recommended</span>
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-60">Weekly Retainer</label>
                    <p className="text-[9px] font-medium italic opacity-40 leading-none">Permanent Placement</p>
                </div>
                <div className="text-right text-white">
                  <span className="text-5xl font-black italic tracking-tighter">${profile.weeklyRate || "1400"}</span>
                  <span className="text-sm font-black opacity-40 italic ml-1">/WK</span>
                </div>
              </div>
              <input 
                type="range" min="500" max="5000" step="50"
                className="w-full accent-white h-2 bg-white/10 rounded-full appearance-none cursor-pointer relative z-10"
                value={profile.weeklyRate || 1400}
                onChange={(e) => handleUpdate("weeklyRate", parseInt(e.target.value))}
              />
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/5 relative z-10">
                 <MaterialIcon name="auto_awesome" className="text-secondary-fixed text-xl" fill />
                 <p className="text-[9px] font-medium text-white/60 italic leading-snug">
                   Retainers provide <span className="font-black text-white">stability and predictable income</span>. Highly preferred by high-net-worth households.
                 </p>
              </div>
              <MaterialIcon name="payments" className="absolute -bottom-10 -right-10 text-[12rem] text-white opacity-5 rotate-12 pointer-events-none group-hover/card:scale-110 transition-transform duration-1000" fill />
            </div>
          </div>

          <div className="bg-surface-container-low/30 p-10 md:p-14 rounded-[3.5rem] border border-outline-variant/10 space-y-10">
              <div className="flex items-start gap-8">
                  <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-black/5 shrink-0">
                      <MaterialIcon name="account_balance_wallet" className="text-primary text-2xl" />
                  </div>
                  <div className="space-y-4">
                      <h4 className="font-headline text-2xl font-black text-primary italic leading-none">Transparency Commitment</h4>
                      <p className="text-on-surface-variant text-sm font-medium italic opacity-70 leading-relaxed max-w-2xl">
                        KindredCare does not take a percentage of your earnings. The rates you set are the rates you receive. We empower caregivers to negotiate their value directly with families.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                      { t: "No Commissions", d: "100% of your rate is yours.", i: "verified" },
                      { t: "Direct Payment", d: "Secure, automated transfers.", i: "bolt" },
                      { t: "Negotiable", d: "Rates are a starting point.", i: "forum" }
                  ].map((feat, idx) => (
                      <div key={idx} className="bg-white p-8 rounded-[2rem] border border-outline-variant/5 shadow-sm space-y-4 hover:shadow-xl transition-all group/feat">
                          <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center group-hover/feat:scale-110 transition-transform">
                              <MaterialIcon name={feat.i} className="text-lg" />
                          </div>
                          <div>
                              <div className="text-[10px] font-black text-primary uppercase tracking-widest italic mb-1">{feat.t}</div>
                              <div className="text-[9px] text-on-surface-variant/60 font-medium italic leading-tight">{feat.d}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
        </div>
        <MaterialIcon name="monetization_on" className="absolute -bottom-20 -left-20 text-[25rem] text-primary opacity-[0.015] -rotate-12 pointer-events-none" fill />
      </section>

      <div className="px-10">
          <div className="flex items-center gap-6 opacity-40 hover:opacity-100 transition-opacity">
              <div className="w-1 h-12 bg-primary rounded-full" />
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic max-w-xl leading-relaxed">
                By finalizing your rates, you acknowledge that they will be visible on your professional profile and used for matching logic.
              </p>
          </div>
      </div>
    </div>
  );
}
