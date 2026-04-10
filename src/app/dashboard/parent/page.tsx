export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { syncUser } from "@/lib/user-sync";
import { jobs, applications, users, nannyProfiles, children, bookings, parentProfiles } from "@/db/schema";
import { eq, desc, and, count, asc } from "drizzle-orm";
import { db } from "@/db";

import { FamilyHomeHeader } from "@/components/dashboard/FamilyHomeHeader";
import { CareTeamBento } from "@/components/dashboard/CareTeamBento";
import { ApplicantHub } from "@/components/dashboard/ApplicantHub";
import { FamilyBudgetWidget } from "@/components/dashboard/FamilyBudgetWidget";
import { CareActivityFeed } from "@/components/dashboard/CareActivityFeed";
import { HouseholdManualEditor } from "@/components/dashboard/HouseholdManualEditor";
import { getCareTeam, getBookingSeries, getFamilyFinancials, getActivityFeed } from "./care-team/actions";
import { getActiveCareOverview } from "./bookings/actions";

export default async function FamilyDashboard() {
  const user = await syncUser();
  if (!user) redirect("/login");

  const userId = user.id;

  // 1. Parallel Data Fetching
  const [
    parentProfile,
    myChildren,
    activeCareBookings,
    familyFinancials,
    activityFeed,
    careTeamMembers,
    activeApplicants
  ] = await Promise.all([
    db.query.parentProfiles.findFirst({ where: eq(parentProfiles.id, userId) }),
    db.query.children.findMany({ where: eq(children.parentId, userId) }),
    getActiveCareOverview(),
    getFamilyFinancials(),
    getActivityFeed(),
    getCareTeam(),
    db.select({
      id: applications.id,
      jobId: jobs.id,
      jobTitle: jobs.title,
      nannyName: users.fullName,
      nannyImage: users.profileImageUrl,
      status: applications.status,
    })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .innerJoin(users, eq(applications.caregiverId, users.id))
    .where(and(eq(jobs.parentId, userId), eq(applications.status, "pending")))
    .orderBy(desc(applications.createdAt))
    .limit(5)
  ]);

  // 2. Business Logic: Shift Status
  const liveBooking = activeCareBookings.find(b => b.status === "in_progress");
  const nextScheduled = activeCareBookings
    .filter(b => b.status === "confirmed" && b.startDate > new Date())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];

  const profile = {
    familyName: parentProfile?.familyName || user.fullName.split(' ')[0],
    location: parentProfile?.location || "Manhattan, NY",
    familyPhoto: parentProfile?.familyPhoto || ""
  };

  return (
    <div className="bg-surface-container-low/30 min-h-screen pb-32">
      {/* Dynamic Nav (Ported logic from HTML) */}
      <nav className="w-full sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-8 h-20 max-w-7xl mx-auto">
          <div className="flex items-center gap-12">
            <span className="text-2xl font-black tracking-tighter text-primary italic">KindredCare US</span>
            <div className="hidden md:flex gap-8 items-center">
              <Link className="font-bold tracking-tight text-primary border-b-2 border-primary pb-1" href="/dashboard/parent">Dashboard</Link>
              <Link className="font-bold tracking-tight text-on-surface-variant/40 hover:text-primary transition-colors" href="/dashboard/parent/jobs">Find Nannies</Link>
              <Link className="font-bold tracking-tight text-on-surface-variant/40 hover:text-primary transition-colors" href="/dashboard/messages">Messages</Link>
              <Link className="font-bold tracking-tight text-on-surface-variant/40 hover:text-primary transition-colors" href="/dashboard/parent/settings">Family Hub</Link>
            </div>
          </div>
          <div className="flex items-center gap-6">
             <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden ring-2 ring-white shadow-xl">
                <img className="w-full h-full object-cover" src={user.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.fullName}`} alt="User" />
             </div>
          </div>
        </div>
      </nav>

      <main className="p-6 md:p-12 max-w-7xl mx-auto space-y-12">
        {/* 1. Header (Portrait + Kids) */}
        <FamilyHomeHeader profile={profile} children={myChildren} />

        {/* 2. Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-10">
            {/* Core Care Team Section */}
            <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-2xl font-black text-primary italic tracking-tight underline decoration-secondary decoration-4 underline-offset-8">Core Care Team</h2>
                <Link href="/dashboard/parent/care-team" className="text-secondary font-black text-[10px] uppercase tracking-widest hover:underline">Manage Team</Link>
              </div>
              <CareTeamBento activeMember={liveBooking?.caregiver} nextScheduled={nextScheduled} />
            </section>

            {/* Applicant Hub */}
            <ApplicantHub applicants={activeApplicants} />
            
            {/* Household Hub Ledger (Integrated Feed) */}
            <section className="space-y-6">
               <h2 className="text-2xl font-black text-primary italic tracking-tight ml-2">Household Activity</h2>
               <div className="bg-white rounded-[3.5rem] p-10 premium-shadow">
                  <CareActivityFeed events={activityFeed} />
               </div>
            </section>
          </div>

          <aside className="lg:col-span-4 space-y-10">
            {/* Financial Widget */}
            <FamilyBudgetWidget financials={familyFinancials} />

            {/* Household Manual Quick Links */}
            <section className="bg-primary text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-fixed/5 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
               <div className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="font-bold text-xl italic tracking-tight">Home Manual</h2>
                    <MaterialIcon name="sticky_note_2" />
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed font-medium">Quick access for caregivers to essential home rules and emergency contacts.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {["Emergency", "Allergies", "Wi-Fi", "Security"].map(tag => (
                      <div key={tag} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl flex items-center gap-2 cursor-pointer transition-all active:scale-95">
                         <MaterialIcon name="emergency" className="text-secondary-fixed-dim text-sm" fill />
                         <span className="text-[10px] font-black uppercase tracking-tight">{tag}</span>
                      </div>
                    ))}
                  </div>
                  <Link href="/dashboard/parent/settings" className="block w-full py-4 border border-white/10 text-center rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                    Edit Guidelines
                  </Link>
               </div>
            </section>

            {/* Elite Upsell */}
            <section className="bg-gradient-to-br from-secondary-fixed-dim via-secondary-container to-secondary-fixed p-10 rounded-[3.5rem] relative overflow-hidden group shadow-2xl shadow-secondary/10">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <MaterialIcon name="workspace_premium" className="text-on-secondary-fixed" fill />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-on-secondary-fixed">Elite Membership</span>
                </div>
                <h3 className="text-3xl font-black text-on-secondary-fixed tracking-tighter leading-none">Upgrade to Kindred Elite</h3>
                <p className="text-on-secondary-fixed-variant text-sm font-medium leading-relaxed opacity-80 italic">Unlock priority placement, zero booking fees, and 24/7 concierge support.</p>
                <button className="w-full py-5 bg-on-secondary-fixed text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all">Start 14-Day Free Trial</button>
              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* FAB: Post Job */}
      <Link 
        href="/dashboard/parent/post-job"
        className="fixed bottom-10 right-10 w-20 h-20 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center group hover:scale-110 active:scale-90 transition-all z-40 border-4 border-white/50 backdrop-blur-md"
      >
        <MaterialIcon name="add" className="text-4xl group-hover:rotate-90 transition-transform" />
      </Link>
    </div>
  );
}
