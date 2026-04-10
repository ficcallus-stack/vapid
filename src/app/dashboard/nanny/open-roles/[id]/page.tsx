import { MaterialIcon } from "@/components/MaterialIcon";
import Link from "next/link";
import { getJobDetail } from "../actions";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import { db } from "@/db";
import { users, nannyProfiles, applications } from "@/db/schema";
import { requireUser } from "@/lib/get-server-user";
import { eq, and } from "drizzle-orm";
import ApplyButton from "./ApplyButton";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIMES = [
  { label: "Early Morning", range: "6AM - 8AM", id: "early_morning" },
  { label: "Morning", range: "8AM - 10AM", id: "morning" },
  { label: "Late Morning", range: "10AM - 12PM", id: "late_morning" },
  { label: "Midday", range: "12PM - 2PM", id: "midday" },
  { label: "Early Afternoon", range: "2PM - 4PM", id: "early_afternoon" },
  { label: "Late Afternoon", range: "4PM - 6PM", id: "late_afternoon" },
  { label: "Evening", range: "6PM - 8PM", id: "evening" },
  { label: "Late Evening", range: "8PM - 10PM", id: "late_evening" },
];

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const awaitedParams = await params;
  const user = await requireUser();
  const job: any = await getJobDetail(awaitedParams.id);

  if (!job) return notFound();

  // Fetch full user record for subscription status
  const userRecord = await db.query.users.findFirst({
    where: eq(users.id, user.uid)
  });

  // Fetch nanny verification status
  const profile = await db.query.nannyProfiles.findFirst({
    where: eq(nannyProfiles.id, user.uid)
  });

  // Check if nanny has already applied
  const existingApp = await db.query.applications.findFirst({
    where: and(
        eq(applications.jobId, awaitedParams.id),
        eq(applications.caregiverId, user.uid)
    )
  });

  const isVerified = profile?.isVerified || false;
  const hasApplied = !!existingApp;
  
  const isRetainer = job.hiringType === "retainer";
  
  // Schedule Parser Logic
  const scheduleData = job.schedule || {};
  const totalSlots = Object.values(scheduleData).filter(Boolean).length;
  const totalWeeklyHours = totalSlots * 2; 

  // Asset Fallbacks
  const familyPhoto = job.profile?.familyPhoto || "https://images.unsplash.com/photo-1510520434124-5bc7e642b61d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80";
  const mapFallback = "/illustrations/map_fallback.png";

  // Data-driven Prerequisites
  const requirementsData = job.requirements || {};
  const certsData = job.certs || {};
  const activeRequirements = [
    ...(certsData.cpr ? [{ icon: "medical_services", label: "CPR Certified" }] : []),
    ...(certsData.first_aid ? [{ icon: "emergency", label: "First Aid Certified" }] : []),
    ...(certsData.badge ? [{ icon: "verified_user", label: "Global Care Badge" }] : []),
    ...(requirementsData.isNonSmoker ? [{ icon: "no_smoking", label: "Non-smoker" }] : []),
    ...(requirementsData.isSafeDriver ? [{ icon: "directions_car", label: "Safe Driver" }] : []),
    ...(requirementsData.hasOwnTransport ? [{ icon: "home_appliance_proximity", label: "Own Transport" }] : []),
  ];

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .squircle-lg {
            clip-path: polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%);
            border-radius: 2rem;
        }
        .squircle-top-left-bottom-right {
           border-radius: 1.5rem 0.75rem 0.75rem 1.5rem;
        }
      `}} />

      {/* TopAppBar Navigation Shell */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-outline-variant/10">
        <div className="flex items-center justify-between px-6 py-3 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <span className="text-xl font-bold tracking-tight text-slate-900 font-headline italic">KindredCare US</span>
            <nav className="hidden md:flex items-center gap-6 font-headline text-sm font-bold">
              <Link href="/dashboard/nanny" className="text-slate-500 hover:text-slate-700 transition-all">Dashboard</Link>
              <Link href="/dashboard/nanny/open-roles" className="text-primary font-black border-b-2 border-primary transition-all">Browse Jobs</Link>
              <Link href="/dashboard/nanny/applications" className="text-slate-500 hover:text-slate-700 transition-all">My Applications</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
             <MaterialIcon name="notifications" className="text-slate-400" />
             <MaterialIcon name="chat_bubble" className="text-slate-400" />
             <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border-2 border-outline-variant/20">
                <img src="/illustrations/kid_girl.png" className="w-full h-full object-cover" />
             </div>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Left Column: Details */}
        <div className="flex-1 space-y-12">
          
          {/* Header Section */}
          <div className="mb-12">
            <nav className="flex items-center gap-2 text-on-surface-variant text-[10px] font-black uppercase tracking-widest mb-4 italic">
              <Link href="/dashboard/nanny/open-roles" className="hover:text-primary transition-colors">Browse Jobs</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-primary">{job.profile?.familyName || "Verified Family"}</span>
            </nav>
            <h1 className="font-headline text-4xl lg:text-5xl font-extrabold tracking-tight text-primary mb-2 text-left">
               The {job.profile?.familyName || "Family"} — {job.title || (isRetainer ? "Recruitment Priority" : "Daily Support")}
            </h1>
            <p className="text-on-surface-variant font-bold flex items-center gap-2 text-sm italic opacity-60">
               <MaterialIcon name="location_on" className="text-primary text-sm" />
               {job.profile?.location || "Private Residence"} • {isRetainer ? "Weekly Retainer" : "Part-time Hourly"}
            </p>
          </div>

          {/* Hero Section & Overview Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            {/* Main Hero Image Card */}
            <div className="lg:col-span-8 relative overflow-hidden rounded-xl shadow-2xl bg-surface-container-lowest h-[450px]">
              <img 
                src={familyPhoto} 
                className="w-full h-full object-cover" 
                alt="Family Portrait"
              />
              <div className="absolute top-6 left-6">
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-xl">
                  <MaterialIcon name="verified" className="text-blue-600 text-sm" fill />
                  <span className="font-headline font-black text-[10px] uppercase tracking-widest text-primary">Verified Family</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <div className="absolute bottom-8 left-8 text-white">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60 mb-1">
                        {job.scheduleType === 'recurring' ? 'Weekly Budget' : 'Hourly Investment'}
                    </span>
                    <span className="text-4xl font-black font-headline italic tracking-tighter decoration-secondary decoration-2 underline-offset-8 underline">
                      {job.scheduleType === 'recurring' 
                        ? `$${(job.retainerBudget || 0) / 100}/wk` 
                        : `$${job.minRate}/hr`
                      }
                    </span>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60 mb-1">Requirement</span>
                    <span className="text-4xl font-black font-headline italic tracking-tighter">
                       {isRetainer ? "40 hrs" : `${totalWeeklyHours} hrs`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Quick Overview Cards */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-white p-8 rounded-xl shadow-xl border-l-[6px] border-primary group text-left">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <MaterialIcon name="account_balance_wallet" fill />
                  </div>
                  <h3 className="font-headline font-black text-primary italic leading-none">Payment Security</h3>
                </div>
                <p className="text-on-surface-variant text-xs leading-relaxed mb-6 font-medium italic opacity-70">
                  Your earnings are protected. This family has pre-authorized the first month of recruitment via our Escrow holding system.
                </p>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-full text-[9px] font-black uppercase tracking-[0.15em]">
                  Funds Secured in Escrow
                </span>
              </div>

              <div className="bg-surface-container-low p-8 rounded-xl space-y-6 text-left">
                <h3 className="font-headline font-black text-primary italic leading-none text-lg">Prerequisites</h3>
                <ul className="space-y-4">
                  {activeRequirements.length > 0 ? activeRequirements.map((req, i) => (
                    <li key={i} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-on-surface-variant/60">
                      <MaterialIcon name={req.icon} className="text-primary text-lg" />
                      {req.label}
                    </li>
                  )) : (
                    <li className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-on-surface-variant/30">
                      <MaterialIcon name="info" className="text-lg" />
                      Standard Nanny Requirements
                    </li>
                  )}
                </ul>
              </div>
              
              <ApplyButton jobId={awaitedParams.id} isVerified={isVerified} hasApplied={hasApplied} familyName={job.profile?.familyName} fullWidth />
            </div>
          </div>

          {/* Child Profiles Section */}
          <section className="mb-20">
             <div className="flex items-end justify-between mb-12">
               <div>
                 <span className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] italic">The Little Ones</span>
                 <h2 className="font-headline text-4xl font-black italic tracking-tighter text-primary">Child Profiles</h2>
               </div>
               <div className="h-0.5 flex-1 mx-12 bg-surface-container/30 hidden lg:block"></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {job.children?.length > 0 ? job.children.map((child: any, idx: number) => (
                 <div key={child.id} className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all relative overflow-visible flex gap-8 group text-left">
                   <div className="flex-shrink-0">
                      <div className="w-28 h-28 squircle-top-left-bottom-right overflow-hidden shadow-inner ring-4 ring-surface-container-low grayscale group-hover:grayscale-0 transition-all duration-700">
                         <img 
                           src={child.photoUrl || (child.type === 'infant' || child.type === 'toddler' ? "/illustrations/kid_boy.png" : "/illustrations/kid_girl.png")} 
                           className="w-full h-full object-cover" 
                           alt={child.name}
                         />
                      </div>
                   </div>
                   <div className="flex-grow space-y-4">
                      <div className="flex justify-between items-start text-left">
                         <div>
                            <h3 className="font-headline font-black text-3xl italic tracking-tighter text-primary leading-none mb-1">{child.name}</h3>
                            <span className="text-on-surface-variant font-black text-[10px] uppercase tracking-widest opacity-40 italic">{child.age} Years Old</span>
                         </div>
                         <span className="bg-secondary-fixed-dim text-on-secondary-fixed text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full capitalize">{child.type || "Child"}</span>
                      </div>
                      <p className="text-on-surface-variant text-[13px] leading-relaxed italic font-medium opacity-80 line-clamp-2">
                        "{child.bio || "No biography has been shared for this profile yet."}"
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {child.interests && child.interests.length > 0 ? child.interests.map((interest: string, i: number) => (
                          <span key={i} className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-black uppercase tracking-widest text-primary/60 border border-outline-variant/10 group-hover:bg-primary/5">
                            {interest}
                          </span>
                        )) : (
                          <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 border border-outline-variant/5 group-hover:bg-primary/5 italic">
                            No interests listed
                          </span>
                        )}
                      </div>

                      <div className={cn(
                        "p-4 rounded-xl flex items-start gap-3 border",
                        child.medicalNotes ? "bg-error-container/10 border-error-container/20" : "bg-tertiary-fixed/10 border-tertiary-fixed/20"
                      )}>
                        <MaterialIcon name={child.medicalNotes ? "medical_services" : "info"} className={cn("text-lg", child.medicalNotes ? "text-error" : "text-tertiary")} />
                        <div className="text-[10px] leading-relaxed">
                          <p className="font-black uppercase tracking-widest italic mb-1 text-primary">{child.medicalNotes ? "Medical Note" : "Daily Activity Note"}</p>
                          <p className="text-on-surface-variant font-medium opacity-60">
                             {child.medicalNotes || "The parent has not specified any medical alerts for this child."}
                          </p>
                        </div>
                      </div>
                   </div>
                 </div>
               )) : (
                 <div className="col-span-full py-20 bg-surface-container-low/30 rounded-[3.5rem] flex flex-col items-center gap-4 text-center">
                    <MaterialIcon name="child_care" className="text-5xl text-outline-variant" />
                    <p className="font-headline text-xl font-bold text-on-surface-variant italic">The parent has not yet attached child profiles to this job.</p>
                 </div>
               )}
             </div>
          </section>

          {/* Family Values Section */}
          <section className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center text-left">
             <div className="relative group">
                <div className="squircle-lg overflow-hidden bg-slate-200 aspect-video lg:aspect-square shadow-2xl relative z-10 border-8 border-white group-hover:scale-[1.02] transition-transform duration-700">
                   <img 
                     src={familyPhoto} 
                     className="w-full h-full object-cover" 
                     alt="Home"
                   />
                </div>
                <div className="absolute -top-10 -left-10 w-40 h-40 bg-secondary-fixed/30 rounded-full blur-3xl -z-10 group-hover:scale-125 transition-transform duration-1000"></div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 border-[12px] border-surface-container-high/40 squircle-lg -z-10"></div>
             </div>
             <div>
                <span className="text-secondary font-black uppercase tracking-[0.4em] text-[10px] italic">Our Way of Life</span>
                <h2 className="font-headline text-5xl font-black italic tracking-tighter text-primary mb-8 leading-none">Family Values <br /> & Philosophy</h2>
                <div className="space-y-6 text-on-surface-variant leading-relaxed text-lg font-medium italic opacity-70">
                   {job.profile?.philosophy ? (
                      <div className="prose prose-slate italic">
                        {job.profile.philosophy.split('\n').map((para: string, i: number) => (
                           <p key={i}>{para}</p>
                        ))}
                      </div>
                   ) : (
                     <p className="p-8 bg-surface-container-low italic rounded-2xl border border-dashed border-outline-variant/30 text-left">
                        "The family has not yet provided a philosophical statement. We recommend discussing their parenting style during the initial trial or interview."
                     </p>
                   )}
                   
                   <div className="flex gap-4 pt-6">
                      <div className="flex-1 p-5 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Language</p>
                         <p className="text-xs font-bold leading-relaxed italic">{job.language || "English"}</p>
                      </div>
                      <div className="flex-1 p-5 bg-white rounded-2xl shadow-sm border border-outline-variant/10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Duties</p>
                         <p className="text-xs font-bold leading-relaxed italic">{job.duties || "General care"}</p>
                      </div>
                   </div>
                </div>
             </div>
          </section>

          {/* Final CTA Area */}
          <section className="bg-primary p-16 md:p-24 rounded-[3rem] text-white text-center relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-96 h-96 bg-primary-container rounded-full blur-[120px] opacity-40 -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-1000"></div>
             <div className="relative z-10 space-y-10">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-primary-fixed block animate-pulse">Placement Opportunity</span>
                <h2 className="font-headline text-5xl md:text-7xl font-black italic tracking-tighter leading-[0.85] italic">
                   Ready to join the <br /> {job.profile?.familyName || "Family"} household?
                </h2>
                <p className="text-blue-100/70 text-lg md:text-2xl font-medium max-w-2xl mx-auto italic mb-12">
                   This role is highly contested for its premium stability. Secure your spotlight and apply today for an initial screening.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                   <ApplyButton jobId={awaitedParams.id} isVerified={isVerified} hasApplied={hasApplied} familyName={job.profile?.familyName} size="lg" />
                   <button className="w-full sm:w-auto border-2 border-white/20 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-white/10 transition-all active:scale-95 shadow-xl">
                      Save Opportunity
                   </button>
                </div>
             </div>
          </section>
        </div>

        {/* Right Sidebar: Actions (Desktop Only Toggle style) */}
        <aside className="hidden lg:block w-80 shrink-0">
           <div className="sticky top-24 space-y-8">
              {/* Invitation Card */}
              <div className="bg-white p-10 rounded-[2rem] shadow-2xl border border-outline-variant/10 text-center relative overflow-hidden group">
                 <div className="mx-auto w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mb-8 rotate-3 group-hover:rotate-0 transition-transform">
                    <MaterialIcon name="mail_lock" className="text-primary text-3xl" fill />
                 </div>
                 <h3 className="text-2xl font-black italic tracking-tighter text-primary mb-4">Trial Invitation</h3>
                 <p className="text-xs text-on-surface-variant font-medium opacity-60 leading-relaxed italic mb-10">
                    The {job.profile?.familyName || "Family"} family is seeking an immediate fit for their upcoming recruitment window.
                 </p>
                 <div className="space-y-4">
                    <ApplyButton jobId={awaitedParams.id} isVerified={isVerified} hasApplied={hasApplied} familyName={job.profile?.familyName} fullWidth />
                    <button className="w-full py-4 text-slate-400 font-black uppercase tracking-widest text-[10px]">Decline Interest</button>
                 </div>
                 <div className="pt-8 mt-8 border-t border-outline-variant/10 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 mb-4 italic">Guaranteed Payroll via Escrow</p>
                    <div className="flex justify-center gap-4 opacity-30 grayscale transition-all group-hover:grayscale-0 group-hover:opacity-60">
                       <img alt="Visa" className="h-4" src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg" />
                       <img alt="Mastercard" className="h-4" src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" />
                    </div>
                 </div>
              </div>

              {/* Map Preview */}
              <div className="bg-white rounded-[2rem] overflow-hidden shadow-xl border border-outline-variant/5 group">
                 <div className="h-48 bg-slate-100 relative overflow-hidden text-left">
                    <img src={mapFallback} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" alt="Neighborhood" />
                    <div className="absolute inset-0 bg-primary/5"></div>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[9px] font-black text-primary uppercase tracking-widest shadow-md">
                       {job.profile?.location ? `${job.profile.location.split(',')[0]} AREA` : "PRIVATE AREA"}
                    </div>
                 </div>
                 <div className="p-6 text-left">
                    <div className="flex items-center gap-3 mb-2">
                       <MaterialIcon name="location_on" className="text-secondary" fill />
                       <p className="text-[11px] font-black text-primary uppercase tracking-widest">Premium Enclave</p>
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-medium opacity-50 italic italic leading-relaxed">
                       Exact residence details will be shared once your application is approved for a trial.
                    </p>
                 </div>
              </div>

              {/* Support Section */}
              <div className="p-8 bg-tertiary-fixed/20 rounded-[2rem] border border-tertiary-fixed/30 flex gap-4 ring-8 ring-tertiary-fixed/5 text-left">
                 <MaterialIcon name="verified_user" className="text-tertiary shrink-0" fill />
                 <div>
                    <p className="font-black italic text-tertiary text-sm mb-1 leading-none">KindredCare Trust</p>
                    <p className="text-[10px] text-tertiary/60 font-medium italic leading-relaxed">
                       This placement is bound by our Family-Safe guarantee. All sessions are fully insured and pre-funded.
                    </p>
                 </div>
              </div>
           </div>
        </aside>
      </main>

      {/* Mobile Footer NavBar Overlay */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-outline-variant/10 py-6 px-10 flex md:hidden items-center justify-between z-50">
         <MaterialIcon name="dashboard" className="text-slate-300" />
         <MaterialIcon name="search" className="text-primary" fill />
         <MaterialIcon name="assignment_turned_in" className="text-slate-300" />
         <MaterialIcon name="mail" className="text-slate-300" />
         <MaterialIcon name="person" className="text-slate-300" />
      </footer>
    </div>
  );
}
