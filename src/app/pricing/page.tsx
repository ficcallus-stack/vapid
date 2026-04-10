import { MaterialIcon } from "@/components/MaterialIcon";
import { ShieldCheck, Star, Users, Zap, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        .editorial-shadow {
          box-shadow: 0 40px 100px -20px rgba(3, 31, 65, 0.08), 0 20px 40px -15px rgba(3, 31, 65, 0.04);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .asymmetric-pill {
          border-radius: 999px 999px 100px 999px;
        }
      `}} />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto text-center border-b border-outline-variant/10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-container/30 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
           <Zap className="w-3 h-3 text-secondary shrink-0" fill="currentColor" />
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Transparent Stewardship</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black font-headline text-primary tracking-tighter mb-8 italic leading-[0.9] animate-in fade-in slide-in-from-bottom-4 duration-700">
          Premium Care,<br />
          <span className="text-secondary">Measured Fees.</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-on-surface-variant leading-relaxed opacity-70 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          Professionalism shouldn't be a mystery. KindredCare operates on fixed, transparent rates that fund our world-class safety vetting and escrow protection.
        </p>
      </section>

      {/* Pricing Tiers Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* Family Tier */}
        <div className="group relative">
           <div className="absolute -inset-4 bg-primary/5 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="relative bg-white rounded-[3.5rem] p-12 editorial-shadow border border-outline-variant/5 h-full flex flex-col">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h2 className="text-4xl font-black font-headline text-primary tracking-tight italic mb-2">For Families</h2>
                    <p className="text-on-surface-variant font-medium">Hiring verified professionals.</p>
                 </div>
                 <div className="bg-primary-container p-4 rounded-3xl">
                    <Users className="text-white w-8 h-8" />
                 </div>
              </div>

              <div className="space-y-8 flex-1">
                 <div className="p-6 bg-surface-container-low rounded-3xl border border-outline-variant/5 flex justify-between items-center">
                    <div>
                       <span className="block font-black text-xs uppercase tracking-widest text-secondary mb-1">Platform Service Fee</span>
                       <span className="text-lg font-bold text-primary">Included in every escrow deposit</span>
                    </div>
                    <span className="text-3xl font-black font-headline text-primary">7.5%</span>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                       Fully Insured Escrow Protection
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                       Dedicated Conflict Mediation
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                       <CheckCircle className="w-5 h-5 text-emerald-500" />
                       Access to Top 1% Verified Nannies
                    </div>
                 </div>

                 {/* Premium Upgrade Card */}
                 <div className="bg-primary p-1 rounded-[2.5rem] mt-12 overflow-hidden shadow-2xl">
                    <div className="bg-white rounded-[2.3rem] p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                       <div>
                          <span className="inline-block bg-secondary text-on-secondary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3">Best Value</span>
                          <h3 className="text-2xl font-black font-headline text-primary italic leading-none mb-1">Kindred Premium</h3>
                          <p className="text-xs text-on-surface-variant font-medium">Waives all job posting fees.</p>
                       </div>
                       <div className="text-center md:text-right">
                          <span className="block text-3xl font-black font-headline text-primary tracking-tighter">$23<span className="text-sm opacity-40">/mo</span></span>
                          <Link href="/dashboard/parent/settings/premium" className="text-[10px] font-black text-secondary uppercase tracking-[0.15em] underline underline-offset-4">Upgrade Now</Link>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Caregiver Tier */}
        <div className="group relative">
           <div className="absolute -inset-4 bg-secondary/5 rounded-[4rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <div className="relative bg-surface-container-low rounded-[3.5rem] p-12 editorial-shadow border border-outline-variant/10 h-full flex flex-col">
              <div className="flex justify-between items-start mb-12">
                 <div>
                    <h2 className="text-4xl font-black font-headline text-primary tracking-tight italic mb-2">For Nannies</h2>
                    <p className="text-on-surface-variant font-medium">Building a legacy of excellence.</p>
                 </div>
                 <div className="bg-secondary p-4 rounded-3xl">
                    <ShieldCheck className="text-white w-8 h-8" />
                 </div>
              </div>

              <div className="space-y-8 flex-1">
                 <div className="p-6 bg-white rounded-3xl border border-outline-variant/5 flex justify-between items-center shadow-sm">
                    <div>
                       <span className="block font-black text-xs uppercase tracking-widest text-primary mb-1">Booking Commission</span>
                       <span className="text-lg font-bold text-on-surface-variant/60 tracking-tight leading-none italic">Applied only on successful bookings.</span>
                    </div>
                    <span className="text-3xl font-black font-headline text-primary">15%</span>
                 </div>

                 <div className="space-y-4">
                    <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                       <CheckCircle className="w-5 h-5 text-primary" />
                       Free Professional Background Check
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                       <CheckCircle className="w-5 h-5 text-primary" />
                       Direct-Deposit Earnings (Instant Pay)
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant font-medium">
                       <CheckCircle className="w-5 h-5 text-primary" />
                       Elite Certification Program Entry
                    </div>
                 </div>

                 <div className="bg-white/40 p-10 rounded-[2.5rem] mt-12 border border-outline-variant/10 italic">
                    <p className="text-sm text-primary leading-relaxed font-medium">
                      "KindredCare isn't just a marketplace; it's a partner in my professional growth. The commission fuels the concierge support that keeps my schedule full."
                    </p>
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mt-4">— Sarah J., Elite Verified Caregiver</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Detailed Breakdown */}
      <section className="py-24 px-6 max-w-5xl mx-auto border-t border-outline-variant/10">
         <h2 className="text-3xl font-black font-headline text-primary italic mb-12 text-center">Comprehensive Fee Breakdown</h2>
         <div className="bg-white rounded-[2.5rem] overflow-hidden border border-outline-variant/10 shadow-xl">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/10">
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Service Component</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Basis</th>
                     <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 text-right">Family Cost</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-outline-variant/5">
                  <tr>
                     <td className="px-8 py-6 font-bold text-primary tracking-tight">Standard Job Posting</td>
                     <td className="px-8 py-6 text-sm text-on-surface-variant italic font-medium">One-time per listing</td>
                     <td className="px-8 py-6 text-right font-black text-primary">$0.00 <span className="text-[10px] opacity-40">(Waitlist Era)</span></td>
                  </tr>
                  <tr>
                     <td className="px-8 py-6 font-bold text-primary tracking-tight">Platform Service Fee</td>
                     <td className="px-8 py-6 text-sm text-on-surface-variant italic font-medium">7.5% of estimated total</td>
                     <td className="px-8 py-6 text-right font-black text-secondary">Varies</td>
                  </tr>
                  <tr className="bg-primary/5">
                     <td className="px-8 py-6 font-bold text-primary tracking-tight flex items-center gap-2">
                        Featured Status
                        <span className="bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Boost</span>
                     </td>
                     <td className="px-8 py-6 text-sm text-on-surface-variant italic font-medium">Priority Ranking (Optional)</td>
                     <td className="px-8 py-6 text-right font-black text-primary">$10.00</td>
                  </tr>
                  <tr>
                     <td className="px-8 py-6 font-bold text-primary tracking-tight">SMS Priority Dispatch</td>
                     <td className="px-8 py-6 text-sm text-on-surface-variant italic font-medium">Broadcast to top 50 nannies</td>
                     <td className="px-8 py-6 text-right font-black text-primary">$5.00</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </section>

      {/* CTA Section */}
      <section className="pb-32 px-6 max-w-7xl mx-auto">
         <div className="bg-primary rounded-[4rem] p-16 text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1491113548135-c8bd30849823?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80')] opacity-10 grayscale brightness-0 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="relative z-10">
               <h2 className="text-5xl md:text-7xl font-black font-headline text-white italic tracking-tighter mb-8 max-w-3xl mx-auto leading-[0.9]">
                  Ready to invest in <span className="text-secondary">quality care?</span>
               </h2>
               <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                  <Link href="/browse" className="bg-white text-primary px-12 py-6 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                     Browse Professionals
                     <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/register/parent" className="text-white border-b-2 border-white/20 pb-1 font-headline font-black text-sm uppercase tracking-widest hover:border-white transition-all">Start Your Search</Link>
               </div>
            </div>
         </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-20 bg-surface-container-low border-t border-outline-variant/10">
         <div className="max-w-7xl mx-auto px-6 text-center">
             <span className="text-4xl font-black font-headline text-primary italic tracking-tighter mb-6 block">KindredCare.</span>
             <p className="text-[10px] font-black uppercase tracking-[0.4em] text-on-surface-variant opacity-40">The Legacy of Excellence</p>
         </div>
      </footer>
    </div>
  );
}
