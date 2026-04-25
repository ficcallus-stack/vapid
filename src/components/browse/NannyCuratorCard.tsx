import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { isWithinCurrentWeek } from "@/lib/date-utils";
import Link from "next/link";

interface NannyCuratorCardProps {
  nanny: {
    id: string;
    name: string;
    profileImageUrl: string | null;
    location: string | null;
    experienceYears: number | null;
    hourlyRate: string | number | null;
    weeklyRate: string | number | null;
    isVerified: boolean;
    availability: any;
    isOccupied: boolean;
    specializations?: string[];
  };
}

export function NannyCuratorCard({ nanny }: NannyCuratorCardProps) {
  const availability = nanny.availability || {};
  const isInstant = availability.instantAvailable && availability.instantUntil && new Date(availability.instantUntil) > new Date();
  const alwaysAvailable = availability.alwaysAvailable ?? true;
  const isExpired = !alwaysAvailable && !isWithinCurrentWeek(availability.lastScheduleUpdate);
  
  // Weekly Retainer as primary focus
  const displayWeekly = nanny.weeklyRate || "1,200";
  let displayHourly = nanny.hourlyRate || "35";

  if (isInstant) {
    const { calculateInstantRate } = require("@/lib/pricing-utils");
    displayHourly = calculateInstantRate(displayHourly);
  }

  return (
    <div className="nanny-card group relative bg-[#f4f3f3] p-4 rounded-xl transition-all duration-500 hover:bg-[#eeeeee]">
      <div className="relative -mt-10 mb-6">
        <div className="rounded-tl-[1.5rem] rounded-tr-[0.25rem] rounded-br-[1.5rem] rounded-bl-[0.25rem] overflow-hidden shadow-[0_40px_60px_-15px_rgba(3,31,65,0.04)] transition-transform duration-500 group-hover:scale-[1.02] aspect-[4/5] bg-[#e3e2e2]">
          <img 
            className="w-full h-full object-cover" 
            alt={nanny.name} 
            // Fallback for profile image
            src={nanny.profileImageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${nanny.name}`} 
          />
        </div>
        
        {/* Badges Overlay */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {nanny.specializations?.includes("Global Care") && (
            <div className="relative bg-[#031f41]/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
              Global Care
            </div>
          )}
          {alwaysAvailable ? (
            <div className="relative bg-emerald-500/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <MaterialIcon name="verified" className="text-[10px]" />
              Full-Time Ready
            </div>
          ) : (
            <div className={cn(
              "relative backdrop-blur-md text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5",
              isExpired ? "bg-rose-500/90 text-white" : "bg-white/90 text-primary"
            )}>
              <MaterialIcon name={isExpired ? "event_busy" : "event_available"} className="text-[10px]" />
              {isExpired ? "Schedule Expired" : "Ad-Hoc / Part-Time"}
            </div>
          )}
        </div>

        {/* Instant Availability Badge */}
        {isInstant && (
          <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 shadow-[0_8px_16px_-4px_rgba(186,26,26,0.15)] border border-error/10 transition-transform group-hover:scale-105">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
            <span className="text-[9px] font-extrabold text-[#000716] uppercase tracking-widest leading-none mt-0.5">Ready &lt; 4h</span>
          </div>
        )}
      </div>

      <div className="space-y-4 px-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-headline font-bold text-[#000716]">{(nanny.name || '').split(' ')[0]} {nanny.name.split(' ')[1]?.[0]}.</h3>
            <p className="text-sm text-[#44474e] flex items-center gap-1 mt-0.5">
              <MaterialIcon name="location_on" className="text-[14px] text-[#875124]" />
              {nanny.location && /^\d{5}$/.test(nanny.location) ? `Zip ${nanny.location} Area` : (nanny.location || "Nearby")}
            </p>
          </div>
          {nanny.isVerified && (
            <div className="bg-[#b9ecee]/30 text-[#1a4e50] px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-tighter flex items-center gap-1 shadow-sm">
              <MaterialIcon name="verified_user" className="text-xs" fill /> Verified
            </div>
          )}
        </div>

        {/* Retainer-First Dual Rate Interface */}
        <div className="grid grid-cols-1 gap-2 py-4 border-y border-[#031f41]/5">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[9px] uppercase text-[#031f41]/40 font-bold tracking-[0.1em] mb-0.5">Weekly Retainer</p>
              <p className="text-2xl font-headline font-bold text-[#000716] tracking-tight leading-none italic">
                ${displayWeekly}<span className="text-[11px] font-normal not-italic text-[#44474e]/60">/wk</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase text-[#031f41]/40 font-bold tracking-[0.1em] mb-0.5">Ad-hoc Rate</p>
              <p className="text-sm font-headline font-bold text-[#44474e]/50 italic lining-nums">
                ${displayHourly}<span className="text-[10px] font-normal not-italic">/hr</span>
              </p>
            </div>
          </div>
        </div>

        <Link 
          href={`/nannies/${nanny.id}`}
          className="w-full flex items-center justify-center py-3.5 bg-white text-[#000716] font-bold text-sm rounded-xl hover:bg-[#000716] hover:text-white shadow-sm transition-all duration-300 active:scale-[0.98]"
        >
          View Portfolio
        </Link>
      </div>
    </div>
  );
}
