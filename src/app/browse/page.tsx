import { db } from "@/db";
import { users, nannyProfiles, parentProfiles } from "@/db/schema";
import { eq, and, or, ilike, lte, sql, desc } from "drizzle-orm";
import BrowseCommandCenter from "@/components/browse/BrowseCommandCenter";
import { NannyCuratorCard } from "@/components/browse/NannyCuratorCard";
import { MaterialIcon } from "@/components/MaterialIcon";
import { trackSearch } from "./actions";
import { getServerUser } from "@/lib/get-server-user";

export const dynamic = 'force-dynamic';

export default async function BrowseNannies({ searchParams }: { searchParams: Promise<any> }) {
  const params = await searchParams;
  const user = await getServerUser();
  
  // 1. Initial Location Resolution (Profile -> URL -> Fallback handled by Client)
  let lat = params.lat ? parseFloat(params.lat) : undefined;
  let lng = params.lng ? parseFloat(params.lng) : undefined;
  let locationLabel = params.location || "";

  // If logged in and no coordinates in URL, pull from Parent Profile
  if (user && !lat && !lng) {
    const [profile] = await db.select()
      .from(parentProfiles)
      .where(eq(parentProfiles.id, user.uid))
      .limit(1);
    
    if (profile?.latitude && profile?.longitude) {
      lat = parseFloat(profile.latitude);
      lng = parseFloat(profile.longitude);
      locationLabel = profile.location || "";
    }
  }

  // 2. Parsing Filters & Pagination
  const page = parseInt(params.page || "1");
  const limit = 10;
  const offset = (page - 1) * limit;

  const mode = params.mode || (lat && lng ? "local" : "nationwide");
  const maxDistance = parseInt(params.distance || "30");
  const maxRateFilter = parseInt(params.rate || (params.rateType === "weekly" ? "4000" : "100"));
  const rateType = params.rateType || "hourly"; // "hourly" or "weekly"
  const globalOnly = params.global === "true";
  const availableNow = params.available === "true";
  const alwaysAvailableOnly = params.always === "true";
  
  const distanceSql = lat && lng 
    ? sql`3958.8 * acos(cos(radians(${lat})) * cos(radians(${nannyProfiles.latitude})) * cos(radians(${nannyProfiles.longitude}) - radians(${lng})) + sin(radians(${lat})) * sin(radians(${nannyProfiles.latitude})))`
    : undefined;

  // 3b. Matching Algorithm Weights (MATCH-01)
  const matchScore = sql<number>`(
    (CASE WHEN ${nannyProfiles.isVerified} THEN 500 ELSE 0 END) +
    ${distanceSql 
      ? sql`(CASE WHEN ${distanceSql} < 30 THEN ((30 - ${distanceSql}) / 30.0) * 200 ELSE 0 END)` 
      : sql`0`} +
    (LEAST(${nannyProfiles.experienceYears}, 15) * 20) +
    (CASE WHEN ${nannyProfiles.updatedAt} > NOW() - INTERVAL '7 days' THEN 100 ELSE 0 END)
  )`.as('match_score');

  // 4. Database Queries (Strict Visibility Guard)
  const whereClause = and(
    eq(users.role, 'caregiver'),
    eq(nannyProfiles.isVerified, true), // MUST be verified
    sql`${nannyProfiles.hourlyRate} > 0`, // MUST have a rate
    sql`${nannyProfiles.experienceYears} > 0`, // MUST have experience
    
    // Ghost Liquidity Bypass: Real users must have strict media, Ghosts skip this check
    or(
      eq(users.isGhost, true),
      and(
        sql`${nannyProfiles.videoUrl} IS NOT NULL`, // MUST have video
        sql`${users.profileImageUrl} IS NOT NULL`, // MUST have profile pic
        sql`jsonb_array_length(${nannyProfiles.photos}) >= 2` // MUST have 2+ photos
      )
    ),
    
    rateType === "hourly" 
      ? (maxRateFilter < 150 ? lte(nannyProfiles.hourlyRate, maxRateFilter.toString()) : undefined)
      : (maxRateFilter < 5000 ? lte(nannyProfiles.weeklyRate, maxRateFilter.toString()) : undefined),
    
    // Hybrid Geo-Text Match
    (mode === "local" && locationLabel)
      ? (distanceSql
          ? or(lte(distanceSql, maxDistance), ilike(nannyProfiles.location, `%${locationLabel}%`))
          : ilike(nannyProfiles.location, `%${locationLabel}%`))
      : undefined,
      
    alwaysAvailableOnly ? sql`${nannyProfiles.availability}->>'alwaysAvailable' = 'true'` : undefined,
  );

  const nanniesQuery = db.select({
    id: users.id,
    name: users.fullName,
    profileImageUrl: users.profileImageUrl,
    location: nannyProfiles.location,
    experienceYears: nannyProfiles.experienceYears,
    hourlyRate: nannyProfiles.hourlyRate,
    weeklyRate: nannyProfiles.weeklyRate,
    isVerified: nannyProfiles.isVerified,
    availability: nannyProfiles.availability,
    isOccupied: nannyProfiles.isOccupied,
    bio: nannyProfiles.bio,
    distance: distanceSql ? sql<number>`${distanceSql}`.as('distance') : sql`0`.as('distance'),
    matchScore: matchScore,
  })
  .from(users)
  .innerJoin(nannyProfiles, eq(users.id, nannyProfiles.id))
  .where(whereClause)
  .orderBy(
    // 1. Primary Sort: Weighted Matching Algorithm
    desc(matchScore),
    // 2. Secondary Sort: "Always Available" status
    desc(sql`(${nannyProfiles.availability}->>'alwaysAvailable')::boolean`),
    // 3. Fallback to distance
    mode === "local" && distanceSql ? sql`distance ASC` : desc(nannyProfiles.updatedAt)
  )
  .limit(limit)
  .offset(offset);

  const countQuery = db.select({ count: sql<number>`count(*)` })
    .from(users)
    .innerJoin(nannyProfiles, eq(users.id, nannyProfiles.id))
    .where(whereClause);

  const [nannies, [{ count: totalCount }]] = await Promise.all([
    nanniesQuery,
    countQuery
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // 4b. Track Search Telemetry for Admin GeoPulse
  if (totalCount > 0) {
    // Fire and forget (optional: await for reliability)
    trackSearch({
      userId: user?.uid,
      queryText: locationLabel || "Nationwide",
      latitude: lat,
      longitude: lng,
      filtersApplied: {
        mode,
        distance: maxDistance,
        rate: maxRateFilter,
        rateType,
        globalOnly,
        availableNow,
        alwaysAvailableOnly
      },
      resultsCount: totalCount
    }).catch(e => console.error("[ANALYTICS] Sync Fail:", e));
  }

  // 5. Client Filtering for 'Available Now'
  const filteredNannies = availableNow 
    ? nannies.filter(n => {
        const avail = n.availability as any;
        return avail?.instantAvailable && avail?.instantUntil && new Date(avail.instantUntil) > new Date();
      })
    : nannies;

  return (
    <div className="bg-[#faf9f9] min-h-screen font-body text-on-surface selection:bg-secondary-container selection:text-on-secondary-container">
      <main className="pt-32 pb-20 px-8 max-w-screen-2xl mx-auto overflow-hidden">
        
        {/* Header Section */}
        <header className="mb-10 text-center md:text-left flex flex-col md:row md:items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-[#000716] tracking-tight mb-4 leading-none">
              The <span className="text-[#875124] italic font-medium">Curated</span> Caregivers
            </h1>
            <p className="text-lg text-[#44474e] leading-relaxed">
              Experience a new standard of childcare excellence. Each caregiver represents a unique blend of expertise, safety, and cultural precision.
            </p>
          </div>
        </header>

        {/* The Command Center / Filters Pill */}
        <BrowseCommandCenter 
          initialLocation={locationLabel} 
          currentPage={page} 
          totalPages={totalPages} 
          totalResults={totalCount}
        />

        {/* Nanny Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16 min-h-[400px]">
          {filteredNannies.length > 0 ? (
            filteredNannies.map((nanny) => (
              <NannyCuratorCard key={nanny.id} nanny={nanny} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center flex flex-col items-center justify-center">
               <div className="w-16 h-16 rounded-full bg-[#e3e2e2] flex items-center justify-center mb-4">
                  <MaterialIcon name="search_off" className="text-3xl text-[#44474e]" />
              </div>
              <h3 className="text-xl font-headline font-bold text-[#000716] mb-2">No caregivers found</h3>
              <p className="text-sm text-[#44474e]">Try expanding your search radius or removing some filters.</p>
            </div>
          )}
        </section>

      </main>

      <footer className="w-full mt-20 bg-[#f4f3f3] border-t border-[#000716]/5">
        <div className="flex flex-col md:flex-row justify-between items-center px-12 py-16 w-full max-w-screen-2xl mx-auto">
            <div className="flex flex-col items-center md:items-start mb-8 md:mb-0">
                <div className="text-lg font-bold text-[#031F41] mb-4">The Digital Curator</div>
                <p className="text-[#44474e] text-xs uppercase tracking-[0.05rem] text-center md:text-left">© 2026 The Digital Curator. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
                <a className="text-[#44474e] hover:text-[#031f41] transition-colors font-body text-xs uppercase tracking-[0.05rem]" href="#">Privacy Policy</a>
                <a className="text-[#44474e] hover:text-[#031f41] transition-colors font-body text-xs uppercase tracking-[0.05rem]" href="#">Terms of Service</a>
                <a className="text-[#44474e] hover:text-[#031f41] transition-colors font-body text-xs uppercase tracking-[0.05rem]" href="#">Safety Standards</a>
                <a className="text-[#44474e] hover:text-[#031f41] transition-colors font-body text-xs uppercase tracking-[0.05rem]" href="#">Contact</a>
            </div>
        </div>
      </footer>
    </div>
  );
}
