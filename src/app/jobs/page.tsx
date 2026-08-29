import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { db } from "@/db";
import { jobs, users, nannyProfiles } from "@/db/schema";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { syncUser } from "@/lib/user-sync";
import { canViewJobs } from "@/lib/nanny-guards";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Available Jobs | KindredCare Marketplace",
  robots: "noindex, nofollow", // Default to noindex for safety, override for authorized
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await syncUser();
  const profile = user?.role === 'caregiver' 
    ? await db.query.nannyProfiles.findFirst({ where: eq(nannyProfiles.id, user.id) })
    : null;

  const isAuthorized = canViewJobs(user as any, profile as any);

  if (!isAuthorized) {
    return (
      <div className="bg-surface min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-error-container text-on-error-container p-6 rounded-full mb-8 shadow-xl">
             <MaterialIcon name="security" className="text-6xl" fill />
          </div>
          <h1 className="text-4xl font-headline font-black text-primary tracking-tight mb-4">Verification Required</h1>
          <p className="text-lg text-on-surface-variant max-w-lg mx-auto mb-10 leading-relaxed">
            For the strict privacy and safety of our families, only <strong>Verified Caregivers</strong>, Admins, and Moderators can view available job listings and family details.
          </p>
          {!user ? (
            <Link href="/login" className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl hover:-translate-y-1 transition-transform">
              Sign In to View Jobs
            </Link>
          ) : (
              <Link href="/dashboard/nanny/verification" className="bg-secondary text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl hover:-translate-y-1 transition-transform">
              Complete Verification
            </Link>
          )}
        </main>
      </div>
    );
  }

  const params = await searchParams;
  const query = params.q || "";

  // Fetch all open jobs, joined with the parent (user)
  const allJobs = await db.select({
    id: jobs.id,
    title: jobs.title,
    description: jobs.description,
    budget: jobs.budget,
    status: jobs.status,
    createdAt: jobs.createdAt,
    familyName: users.fullName,
    isPremium: users.isPremium,
    subscriptionTier: users.subscriptionTier,
    scheduleType: jobs.scheduleType,
  })
  .from(jobs)
  .innerJoin(users, eq(jobs.parentId, users.id))
  .where(
    and(
      eq(jobs.status, "open"),
      query ? ilike(jobs.title, `%${query}%`) : undefined
    )
  )
  .orderBy(desc(jobs.createdAt));

  return (
    <div className="bg-background min-h-screen">

      <div className="flex pt-20">
        {/* SideNavBar / Filters */}
        <aside className="hidden lg:flex flex-col p-8 space-y-2 h-[calc(100vh-80px)] sticky top-20 w-80 bg-surface-container-low border-r border-outline-variant/10 overflow-y-auto">
          <div className="mb-10 px-4">
            <h2 className="text-2xl font-black text-primary font-headline tracking-tighter">Filters</h2>
            <p className="text-xs text-on-surface-variant font-black uppercase tracking-[0.2em] opacity-60">Refine your job search</p>
          </div>
          <nav className="space-y-3">
            {[
              { label: "Distance", icon: "map" },
              { label: "Hourly Rate", icon: "payments" },
              { label: "Schedule", icon: "calendar_month" },
              { label: "Experience", icon: "star" },
              { label: "Requirements", icon: "verified_user" }
            ].map((filter, i) => (
              <button 
                key={filter.label} 
                className={cn(
                  "w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group hover:bg-white hover:shadow-xl hover:translate-x-1 duration-300",
                  i === 0 ? "bg-white text-primary font-black shadow-lg" : "text-on-surface-variant font-medium"
                )}
              >
                <div className={cn("p-2 rounded-xl group-hover:bg-primary/5 transition-colors", i === 0 ? "bg-primary/5" : "bg-transparent")}>
                  <MaterialIcon name={filter.icon} className="text-xl" fill={i === 0} />
                </div>
                <span className="font-headline text-sm tracking-tight">{filter.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 p-6 md:p-10 lg:p-16 max-w-[1400px] mx-auto grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Job List Column */}
          <div className="xl:col-span-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end mb-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tighter font-headline">Available Jobs</h1>
                <p className="text-on-surface-variant font-medium mt-2 text-lg opacity-80">Found {allJobs.length} live opportunities</p>
              </div>
            </header>

            {allJobs.length > 0 ? allJobs.map((job) => {
              const isElite = job.subscriptionTier === 'elite';
              const isPlus = job.subscriptionTier === 'plus';

              return (
              <div 
                key={job.id} 
                className={cn(
                  "group rounded-[2.5rem] p-4 md:p-10 shadow-sm border transition-all flex flex-col md:flex-row gap-10 relative overflow-hidden",
                  isElite 
                    ? "bg-gradient-to-br from-white to-secondary/5 border-secondary/30 shadow-2xl shadow-secondary/10 hover:shadow-secondary/20" 
                    : isPlus 
                    ? "bg-gradient-to-br from-white to-primary/5 border-primary/20 shadow-xl shadow-primary/5 hover:shadow-primary/10"
                    : "bg-surface-container-lowest border-outline-variant/10 hover:border-primary/20 hover:shadow-2xl"
                )}
              >
                {/* Visual Status Bar */}
                <div className={cn(
                  "absolute top-0 left-0 w-2 h-full transition-all group-hover:w-3",
                  isElite ? "bg-secondary" : isPlus ? "bg-primary" : "bg-outline-variant"
                )}></div>
                
                <div className="flex-1 space-y-8 relative z-10">
                  <div className="flex flex-wrap items-center gap-3">
                    {isElite ? (
                      <span className="inline-flex items-center px-4 py-1.5 bg-secondary text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-secondary/20 border-2 border-white/20">
                        <MaterialIcon name="diamond" className="text-lg mr-2 animate-bounce duration-1000" fill />
                        Elite Family
                      </span>
                    ) : isPlus ? (
                      <span className="inline-flex items-center px-4 py-1.5 bg-primary text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-lg shadow-primary/20 border-2 border-white/20">
                        <MaterialIcon name="verified_user" className="text-lg mr-2" fill />
                        Plus Member
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-4 py-1.5 bg-tertiary-fixed text-on-tertiary-fixed text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                        <MaterialIcon name="verified" className="text-lg mr-2" fill />
                        Verified Family
                      </span>
                    )}
                    {isElite && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-secondary-container bg-secondary/10 px-4 py-1.5 rounded-full flex items-center gap-1.5">
                        <MaterialIcon name="bolt" className="text-sm" fill />
                        Priority Posting
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <Link href={`/jobs/${job.id}`}>
                      <h3 className={cn(
                        "text-3xl font-black mb-2 font-headline tracking-tight hover:underline underline-offset-8 transition-all",
                        isElite ? "text-primary decoration-secondary" : "text-primary decoration-primary/30"
                      )}>
                        {job.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2">
                       <p className="text-on-surface-variant flex items-center gap-2 text-sm font-medium opacity-70 italic">
                        <MaterialIcon name="family_restroom" className={cn("text-xl", isElite ? "text-secondary" : "text-primary/50")} />
                        {job.familyName}
                      </p>
                      {isElite && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/10 rounded-full animate-in fade-in zoom-in duration-500">
                          <MaterialIcon name="verified" className="text-secondary text-sm" fill />
                          <span className="text-[8px] font-black text-secondary uppercase tracking-[0.15em]">Official Elite</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-on-surface-variant text-sm font-medium opacity-80 italic line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-outline-variant/10 gap-8">
                    <div className="flex items-center gap-8">
                      <div className="flex flex-col text-center sm:text-left">
                        <span className="text-[10px] uppercase font-black text-on-surface-variant/40 tracking-[0.2em] mb-1">Budget</span>
                        <span className={cn(
                          "text-3xl font-black tabular-nums",
                          isElite ? "text-primary" : "text-primary/80"
                        )}>
                          {job.budget}<span className="text-xs font-black text-slate-400 align-middle ml-1">/HR</span>
                        </span>
                      </div>
                      <div className="w-[1px] h-10 bg-outline-variant/20 hidden sm:block"></div>
                      <div className="flex flex-col text-center sm:text-left">
                        <span className="text-[10px] uppercase font-black text-on-surface-variant/40 tracking-[0.2em] mb-1">Schedule</span>
                        <span className={cn(
                          "text-sm font-black flex items-center gap-2 uppercase tracking-widest mt-2",
                          isElite ? "text-secondary" : "text-primary/60"
                        )}>
                          <MaterialIcon name={job.scheduleType === 'recurring' ? 'sync' : 'event'} className="text-lg" />
                          {job.scheduleType === 'recurring' ? 'Recurring' : 'One-time'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-4 w-full sm:w-auto">
                      <Link 
                        href={`/jobs/${job.id}`}
                        className="flex-1 sm:flex-none px-10 py-4 text-primary font-black uppercase tracking-widest text-xs hover:bg-surface-container rounded-2xl transition-all text-center flex items-center justify-center"
                      >
                        View Details
                      </Link>
                      <Link 
                        href={`/jobs/${job.id}/apply`}
                        className={cn(
                          "flex-1 sm:flex-none px-10 py-5 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all text-center",
                          isElite 
                            ? "bg-primary text-on-primary shadow-primary/20 hover:shadow-secondary/40 hover:-translate-y-1" 
                            : "bg-primary text-on-primary shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1"
                        )}
                      >
                        Apply Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
            }) : (
              <div className="py-40 flex flex-col items-center justify-center text-center opacity-30 italic">
                <MaterialIcon name="work_off" className="text-8xl mb-6" />
                <h3 className="text-3xl font-black font-headline text-primary">No Jobs Currently Posted</h3>
                <p className="text-xl text-balance max-w-md">Check back soon or adjust your search filters to find live care opportunities.</p>
              </div>
            )}
          </div>

          {/* Trust Sidebar Module */}
          <aside className="xl:col-span-4 space-y-10 animate-in fade-in slide-in-from-right-4 duration-1000">
            <div className="bg-primary-container text-on-primary-container rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-secondary/10 blur-3xl -mr-24 -mt-24 rounded-full group-hover:bg-secondary/20 transition-colors"></div>
              <div className="relative z-10">
                <div className="bg-secondary-container/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-10 shadow-inner">
                  <MaterialIcon name="shield_with_heart" className="text-secondary-fixed text-3xl" fill />
                </div>
                <h2 className="text-3xl font-black text-white mb-6 font-headline leading-tight tracking-tighter italic">Safety First, Always.</h2>
                <p className="text-on-primary-container leading-relaxed mb-10 text-lg font-medium opacity-90">We curate every single profile to ensure you work in a safe, professional, and respectful environment.</p>
              </div>
            </div>

            {/* Featured Tip Card */}
            <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-outline-variant/10 hover:shadow-xl transition-all group">
              <h4 className="font-black text-primary mb-6 flex items-center gap-4 font-headline tracking-tighter">
                <MaterialIcon name="lightbulb" className="text-3xl text-secondary animate-pulse" />
                Caregiver Tip
              </h4>
              <p className="text-lg text-on-surface-variant leading-relaxed italic font-medium opacity-80">
                "Verified families are 4x more likely to respond to applications that include a personalized introductory video."
              </p>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
