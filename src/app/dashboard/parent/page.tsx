export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { syncUser } from "@/lib/user-sync";
import { jobs, applications, users, nannyProfiles, children, bookings, parentProfiles } from "@/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { db } from "@/db";
import { format } from "date-fns";

import { FamilyOverviewHero } from "@/components/dashboard/FamilyOverviewHero";
import { CareTeamGrid } from "@/components/dashboard/CareTeamGrid";
import { HouseholdManualEditor } from "@/components/dashboard/HouseholdManualEditor";
import { SeriesManager } from "@/components/dashboard/SeriesManager";
import { FamilyBudgetWidget } from "@/components/dashboard/FamilyBudgetWidget";
import { LiveStatusTracker } from "@/components/dashboard/LiveStatusTracker";
import { CareActivityFeed } from "@/components/dashboard/CareActivityFeed";
import { Scrapbook } from "@/components/dashboard/Scrapbook";
import { TrialConversionPrompt } from "@/components/dashboard/TrialConversionPrompt";
import { getCareTeam, getBookingSeries, getFamilyFinancials, getActivityFeed } from "./care-team/actions";
import { getScrapbookMilestones } from "../nanny/care-actions";
import { getActiveCareOverview } from "./bookings/actions";
import { UpcomingCareWidget } from "@/components/dashboard/UpcomingCareWidget";

export default async function FamilyDashboard() {
  const user = await syncUser();

  if (!user) {
    redirect("/login");
  }

  const userId = user.id;

  // 1. Fetch Profile Data
  const parentProfile = await db.query.parentProfiles.findFirst({
    where: eq(parentProfiles.id, userId),
  });

  // 1b. Fetch Care Team
  const careTeamMembers = await getCareTeam();

  // 1c. Fetch Booking Series
  const activeSeries = await getBookingSeries();

  // 1d. Fetch Monthly Financials
  const familyFinancials = await getFamilyFinancials();

  // 1e. Fetch Activity Ledger (Stage 4)
  const activityFeed = await getActivityFeed();

  // 1f. Fetch Scrapbook Milestones (Stage 5)
  const scrapbookMilestones = await getScrapbookMilestones();

  // 1g. Fetch Recent Trials for Conversion (Stage 6)
  const completedTrial = await db.query.bookings.findFirst({
    where: and(
        eq(bookings.parentId, userId),
        eq(bookings.status, "completed"),
        eq(bookings.isTrial, true)
    ),
    with: {
        caregiver: true
    },
    orderBy: [desc(bookings.endDate)]
  });

  // 1h. Fetch Active/Pending Care for Overview
  const activeCareBookings = await getActiveCareOverview();
  const liveBooking = activeCareBookings.find(b => b.status === "in_progress");

  // 2. Fetch Children
  const myChildren = await db.query.children.findMany({
    where: eq(children.parentId, userId),
  });

  // 3. Fetch Applicants Hub (Latest 2)
  const myApplicants = await db.select({
    id: applications.id,
    jobId: jobs.id,
    jobTitle: jobs.title,
    nannyName: users.fullName,
    nannyImage: users.profileImageUrl,
    nannyRate: nannyProfiles.hourlyRate,
    nannyLocation: nannyProfiles.location,
    status: applications.status,
    caregiverId: users.id,
  })
  .from(applications)
  .innerJoin(jobs, eq(applications.jobId, jobs.id))
  .innerJoin(users, eq(applications.caregiverId, users.id))
  .leftJoin(nannyProfiles, eq(users.id, nannyProfiles.id))
  .where(and(eq(jobs.parentId, userId), eq(applications.status, "pending")))
  .orderBy(desc(applications.createdAt))
  .limit(2);

  // 4. Statistics (Job counts, Booking counts)
  const [activeJobsCount] = await db.select({ count: count() }).from(jobs).where(and(eq(jobs.parentId, userId), eq(jobs.status, "open")));
  const [activeBookingsCount] = await db.select({ count: count() }).from(bookings).where(and(eq(bookings.parentId, userId), eq(bookings.status, "confirmed")));
  const totalPastBookings = await db.select({ count: count() }).from(bookings).where(and(eq(bookings.parentId, userId), eq(bookings.status, "completed")));

  const familyName = parentProfile?.familyName || user.fullName || "Your";
  const familyBio = "Welcome to your family dashboard. Start by updating your profile and child details to find your perfect match.";
  const location = parentProfile?.location || "Location not set";

  return (
    <div className="bg-surface min-h-screen">
      {/* Mobile Sidebar / Shared Sidebar logic would be in a layout, but here we overhauled the page content */}
      
      <main className="p-6 lg:p-10 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
        
        {/* 1. Family Identity & Edit Hub */}
        <FamilyOverviewHero 
          initialProfile={{
            familyName: familyName,
            bio: parentProfile?.bio || familyBio,
            philosophy: parentProfile?.philosophy || "",
            location: location,
            familyPhoto: parentProfile?.familyPhoto || ""
          }}
          userId={userId}
        />

        {/* 2. My Core Care Team (Overhaul Stage 1) */}
        <section className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center justify-between px-2">
            <div>
               <h2 className="font-headline text-3xl font-black text-primary tracking-tighter italic leading-none">The Core Care Team</h2>
               <p className="text-on-surface-variant text-sm font-medium opacity-60 mt-2">Your trusted, regular caregivers.</p>
            </div>
            <Link href="/dashboard/parent/care-team" className="text-link font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 hover:underline underline-offset-8 transition-all opacity-40 hover:opacity-100">
              Manage Team <MaterialIcon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
        </section>

        {/* --- RECURRING OVERHAUL SUITE (Stages 2, 3, 4, 6) --- */}
        <div className="space-y-12">
          {/* 1a. Trial Conversion Prompt (Stage 6) */}
          {completedTrial && (
             <TrialConversionPrompt 
                caregiverName={completedTrial.caregiver.fullName}
                caregiverId={completedTrial.caregiver.id}
             />
          )}

          {/* 2a. Live Pulse (Final Stage 4) */}
          <LiveStatusTracker 
            channelName={`family-presence:${user.id}`} 
            nannyName={liveBooking?.caregiver?.fullName || activeSeries[0]?.caregiverName || "Caregiver"} 
            isActive={!!liveBooking}
            startTime={liveBooking?.startDate}
          />

          {/* 2a-2. Upcoming & Active Care Widget (New Itemized Visibility) */}
          <UpcomingCareWidget bookings={activeCareBookings} />

          {/* 2b. Series Manager (Overhaul Stage 2) */}
          <SeriesManager series={activeSeries} />

          {/* 2c. Financial Hub (Overhaul Stage 3) */}
          <FamilyBudgetWidget financials={familyFinancials} />

          {/* 2d. Activity Ledger (Final Stage 4) */}
          <CareActivityFeed events={activityFeed} />

          {/* 2e. Shared Legacy Scrapbook (Final Stage 5) */}
          <Scrapbook milestones={scrapbookMilestones} />
        </div>

        {/* 3. Child Mini-Profiles */}
        <section className="space-y-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-headline text-3xl font-black text-primary tracking-tighter italic leading-none">Little Kindreds</h2>
            <Link href="/dashboard/parent/children" className="text-link font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 hover:underline underline-offset-8 transition-all">
              Manage Profiles <MaterialIcon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {myChildren.map((child) => (
              <div key={child.id} className="bg-white p-8 rounded-[3rem] shadow-sm hover:shadow-xl transition-all group border border-outline-variant/5">
                <div className="flex items-center gap-8">
                  <div className="relative shrink-0">
                    <img 
                      alt={child.name} 
                      className="w-24 h-24 rounded-[2rem] object-cover grayscale group-hover:grayscale-0 transition-all duration-700 shadow-xl border-4 border-white"
                      src={child.photoUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${child.name}`} 
                    />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-headline text-2xl font-black text-primary leading-none tracking-tight">{child.name}, {child.age}</h3>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed text-[9px] font-black uppercase tracking-widest rounded-full">{child.type}</span>
                       {/* Mock tags based on bio for design parity */}
                       <span className="px-3 py-1 bg-secondary-fixed/30 text-secondary text-[9px] font-black uppercase tracking-widest rounded-full border border-secondary/10">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Link 
              href="/dashboard/parent/children/add"
              className="bg-dashed border-4 border-dashed border-outline-variant/30 p-8 rounded-[3rem] flex flex-col items-center justify-center gap-3 text-on-surface-variant hover:border-primary hover:text-primary transition-all group bg-white/50"
            >
              <MaterialIcon name="add_circle" className="text-4xl group-hover:scale-125 transition-transform" />
              <span className="font-black uppercase tracking-widest text-[10px]">Add Little One</span>
            </Link>
          </div>
        </section>

        {/* 4. Household Hub (Overhaul Stage 1) */}
        <section className="space-y-8 animate-in slide-in-from-bottom duration-700">
          <div className="flex items-center justify-between px-2">
            <div>
               <h2 className="font-headline text-3xl font-black text-primary tracking-tighter italic leading-none">Household Hub</h2>
               <p className="text-on-surface-variant text-sm font-medium opacity-60 mt-2">Core guidelines for your Care Team.</p>
            </div>
          </div>
          <HouseholdManualEditor initialValue={parentProfile?.householdManual || ""} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Applicants Hub */}
          <div className="lg:col-span-8 space-y-10">
            <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-outline-variant/5 h-full relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-fixed/10 rounded-full blur-[100px] -z-0"></div>
               <div className="relative z-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="font-headline text-3xl font-black text-primary tracking-tighter italic leading-none">Applicants Hub</h2>
                    <p className="text-on-surface-variant text-sm font-medium opacity-60 mt-2">Active candidates for your open positions.</p>
                  </div>
                  {myApplicants.length > 0 && (
                    <span className="px-4 py-1.5 bg-secondary-container text-primary text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-black/5">{myApplicants.length} New</span>
                  )}
                </div>
                
                <div className="space-y-4">
                  {myApplicants.length > 0 ? (
                    myApplicants.map((app) => (
                      <div key={app.id} className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-full bg-surface-container-low/50 hover:bg-white border border-transparent hover:border-outline-variant/10 transition-all group lg:pr-8">
                        <div className="flex items-center gap-6">
                           <div className="relative">
                              <img 
                                alt={app.nannyName} 
                                className="w-16 h-16 rounded-2xl object-cover shadow-lg group-hover:scale-105 transition-transform"
                                src={app.nannyImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.nannyName}`} 
                              />
                           </div>
                           <div>
                             <h4 className="font-headline text-2xl font-black text-primary leading-none tracking-tight">{app.nannyName}</h4>
                             <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-30 mt-1 whitespace-nowrap font-label">
                               For: {app.jobTitle}
                             </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                          <Link 
                            href={`/dashboard/messages/user/${app.caregiverId}`}
                            className="w-14 h-14 bg-white text-primary rounded-2xl hover:bg-primary-container transition-all shadow-sm flex items-center justify-center shrink-0 border border-outline-variant/10"
                          >
                            <MaterialIcon name="chat" fill />
                          </Link>
                          <Link 
                            href={`/dashboard/parent/jobs/${app.jobId}/applications`}
                            className="flex-1 md:flex-none px-10 py-5 bg-[#1e293b] text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:scale-[1.02] transition-all text-center font-label"
                          >
                            View Application
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-30 italic px-4">
                      <MaterialIcon name="person_search" className="text-6xl mb-6" />
                      <p className="font-headline font-bold text-xl">Waiting for talent.</p>
                      <p className="text-xs mt-2 uppercase tracking-widest">Post a job to start meeting elite caregivers.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-counters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-outline-variant/10 flex flex-col justify-between h-56 group overflow-hidden relative">
                 <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full group-hover:scale-150 transition-transform"></div>
                 <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <MaterialIcon name="work" className="text-primary" />
                    <h3 className="font-headline text-2xl font-black text-primary italic leading-none tracking-tight">Active Jobs</h3>
                  </div>
                  <p className="text-on-surface-variant text-sm font-medium opacity-60">You have <span className="text-primary font-black uppercase tracking-widest">{activeJobsCount.count} listings</span> open.</p>
                </div>
                <div className="relative z-10 flex items-center justify-between mt-auto">
                   <div className="flex items-center gap-2">
                     <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs border-4 border-white shadow-xl">{activeJobsCount.count}</div>
                     <span className="text-xs font-bold text-on-surface-variant">Active</span>
                   </div>
                   <Link href="/dashboard/parent/jobs" className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                    Manage <MaterialIcon name="chevron_right" />
                   </Link>
                </div>
              </div>

              <div className="bg-primary text-white rounded-[3rem] p-8 shadow-2xl flex flex-col justify-between h-56 relative overflow-hidden group">
                 <div className="absolute -top-4 -left-4 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
                 <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <MaterialIcon name="calendar_today" />
                    <h3 className="font-headline text-2xl font-black italic leading-none tracking-tight">Booking Flow</h3>
                  </div>
                  <p className="text-primary-fixed text-sm font-medium opacity-70 italic">{activeBookingsCount.count} Confirmed • {totalPastBookings[0].count} Memories</p>
                </div>
                <div className="relative z-10">
                  <Link href="/dashboard/parent/bookings" className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                    <MaterialIcon name="history" className="text-sm" />
                    View History
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Modules (Right Column) */}
          <div className="lg:col-span-4 space-y-10">
            {/* Subscription Module (Kindred Elite) */}
            <div className="bg-gradient-to-br from-primary to-primary-container text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-secondary-fixed/20 rounded-full blur-[100px] animate-pulse"></div>
              <div className="relative z-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="bg-white/10 p-4 rounded-[1.5rem] shadow-inner">
                    <MaterialIcon name={user.isPremium ? "verified" : "workspace_premium"} className="text-4xl text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }} />
                  </div>
                  <span className="px-4 py-1 bg-secondary-container text-primary text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl shadow-black/20">
                    {user.isPremium ? "Active" : "Elite Plan"}
                  </span>
                </div>
                <div>
                  <h3 className="font-headline text-3xl font-black italic tracking-tighter leading-none">{user.isPremium ? "Elite Status" : "Kindred Elite"}</h3>
                  <p className="text-primary-fixed text-sm font-black uppercase tracking-[0.2em] opacity-40 mt-2">
                    {user.isPremium ? "Benefits Unlocked" : "$23.00 / month"}
                  </p>
                </div>
                <div className="space-y-4 pt-4 border-t border-white/5">
                  {["Priority Application Feed", "$1M Liability Buffer", "Advanced Safety Screening"].map(benefit => (
                    <div key={benefit} className="flex items-center gap-3 text-xs font-black uppercase tracking-widest opacity-80 italic">
                      <MaterialIcon name="check_circle" className="text-secondary-fixed text-sm" fill />
                      {benefit}
                    </div>
                  ))}
                </div>
                {user.isPremium ? (
                  <Link href="/dashboard/parent/subscription" className="block w-full py-6 bg-white/10 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] hover:bg-white/20 transition-all text-center">
                    Manage Benefits
                  </Link>
                ) : (
                  <Link href="/dashboard/parent/subscription" className="block w-full py-6 bg-secondary-container text-primary font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] shadow-xl shadow-black/30 hover:scale-105 active:scale-95 transition-all text-center">
                    Activate Elite
                  </Link>
                )}
              </div>
            </div>

            {/* Care Memories Preview */}
            <div className="bg-white rounded-[3rem] p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden">
              <h4 className="font-headline text-2xl font-black text-primary mb-8 tracking-tighter italic">Care Memories</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-surface-container-low rounded-[1.5rem] overflow-hidden group">
                  <img 
                    src="https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=2070&auto=format&fit=crop" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                    alt="Memory"
                  />
                </div>
                <div className="aspect-square bg-surface-container-low rounded-[1.5rem] overflow-hidden group">
                  <img 
                    src="https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?q=80&w=2038&auto=format&fit=crop" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                    alt="Memory"
                  />
                </div>
              </div>
              <button className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary opacity-40 hover:opacity-100 transition-all underline underline-offset-8">
                Explore Scrapbook
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FAB: Create Action */}
      <Link 
        href="/dashboard/parent/post-job"
        className="fixed bottom-10 right-10 w-20 h-20 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-90 transition-all z-40 border-4 border-white/50 backdrop-blur-md"
      >
        <MaterialIcon name="add" className="text-4xl group-hover:rotate-90 transition-transform" />
      </Link>
    </div>
  );
}
