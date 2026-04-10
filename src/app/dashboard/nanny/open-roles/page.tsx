import { syncUser } from "@/lib/user-sync";
import { db } from "@/db";
import { nannyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canViewJobs } from "@/lib/nanny-guards";
import { MaterialIcon } from "@/components/MaterialIcon";
import Link from "next/link";
import { getOpenJobs } from "./actions";
import JobBoard from "./JobBoard";

export default async function OpenRolesPage() {
  const user = await syncUser();
  const profile = user?.role === 'caregiver'
    ? await db.query.nannyProfiles.findFirst({ where: eq(nannyProfiles.id, user.id) })
    : null;

  const isAuthorized = canViewJobs(user as any, profile as any);

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-primary/5 w-20 h-20 rounded-2xl flex items-center justify-center mb-8 shadow-inner">
           <MaterialIcon name="verified_user" className="text-primary text-4xl" fill />
        </div>
        <h2 className="text-3xl font-headline font-black text-primary tracking-tighter italic mb-4">Verification Required</h2>
        <p className="text-on-surface-variant max-w-md mx-auto mb-10 font-medium leading-relaxed opacity-70 italic">
          To maintain the privacy of our premium families, full access to open roles is exclusively for **Verified Caregivers**.
        </p>
        <Link 
          href="/dashboard/nanny/verification" 
          className="bg-primary text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all"
        >
          Submit Identity Verification
        </Link>
      </div>
    );
  }

  const initialJobs = await getOpenJobs({ limit: 10, offset: 0 });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <style dangerouslySetInnerHTML={{ __html: `
        .editorial-title {
          line-height: 0.9;
          letter-spacing: -0.05em;
        }
      `}} />

      {/* Editorial Header Section */}
      <header className="mb-16 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-container/20 rounded-full mb-6">
           <span className="material-symbols-outlined text-sm text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Curated Opportunities</span>
        </div>
        <h1 className="font-headline font-black text-6xl md:text-8xl text-primary editorial-title mb-6 italic">
          Open <span className="text-secondary">Roles.</span>
        </h1>
        <p className="text-on-surface-variant text-xl md:text-2xl max-w-2xl leading-tight font-medium opacity-60">
          Discover bespoke opportunities with families who value professional excellence and premium care.
        </p>
      </header>

      <JobBoard initialJobs={initialJobs} />
    </div>
  );
}
