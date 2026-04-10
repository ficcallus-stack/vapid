"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CareTeamBentoProps {
  activeMember: any;
  nextScheduled: any;
}

export function CareTeamBento({ activeMember, nextScheduled }: CareTeamBentoProps) {
  const isOnShift = !!activeMember;

  return (
    <section className="bg-surface-container-lowest p-8 rounded-[3.5rem] premium-shadow relative overflow-hidden flex flex-col md:flex-row gap-10 border border-outline-variant/10 group">
      {/* Shift Status Badge */}
      <div className="absolute top-8 right-8 z-20">
        <span className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl backdrop-blur-md",
            isOnShift ? "bg-tertiary-fixed text-on-tertiary-fixed border border-on-tertiary-fixed/10" : "bg-surface-container-high text-on-surface-variant/40"
        )}>
           <span className={cn("w-2 h-2 rounded-full", isOnShift ? "bg-on-tertiary-fixed animate-pulse" : "bg-current")}></span>
           {isOnShift ? "On Shift Now" : "Systems Standby"}
        </span>
      </div>

      {/* Profile Image (Asymmetric Clip) */}
      <div className={cn(
          "w-44 h-56 asymmetric-clip overflow-hidden flex-shrink-0 shadow-2xl relative transition-transform duration-700 group-hover:scale-[1.02]",
          !activeMember && !nextScheduled && "bg-primary/5 flex items-center justify-center opacity-40"
      )}>
        {(activeMember || nextScheduled) ? (
          <img 
            src={activeMember?.profileImageUrl || nextScheduled?.caregiver?.profileImageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2"} 
            className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
            alt="Caregiver"
          />
        ) : (
          <MaterialIcon name="person_search" className="text-6xl text-primary" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div>
          <h3 className="text-3xl font-black text-primary italic tracking-tighter leading-none mb-3">
             {activeMember?.fullName || nextScheduled?.caregiver?.fullName || "Build Your Tribe"}
          </h3>
          <p className="text-on-surface-variant font-medium text-lg leading-relaxed italic opacity-60">
             {isOnShift 
                ? `“The kids are having a blast with the watercolor set today!”` 
                : nextScheduled 
                  ? `Next shift scheduled for ${nextScheduled.startDate.toLocaleDateString()}` 
                  : "Post a job to start meeting elite caregivers for your family."}
          </p>
        </div>

        {activeMember || nextScheduled ? (
           <div className="flex gap-4">
              <div className="bg-surface-container-low/50 px-6 py-3 rounded-2xl border border-outline-variant/5">
                <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/40 font-black mb-1">{isOnShift ? "Shift Ends" : "Starts"}</p>
                <p className="font-headline font-black text-primary italic">
                    {isOnShift ? "06:00 PM" : "08:00 AM"}
                </p>
              </div>
              <div className="flex gap-2">
                 <button className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 active:scale-95 transition-all">
                    <MaterialIcon name="chat" fill />
                 </button>
                 <button className="w-14 h-14 bg-white border border-outline-variant/10 text-primary rounded-2xl flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-all">
                    <MaterialIcon name="call" fill />
                 </button>
              </div>
           </div>
        ) : (
          <Link 
            href="/dashboard/parent/post-job"
            className="w-fit px-8 py-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Post a New Job
          </Link>
        )}
      </div>

      <style jsx>{`
        .asymmetric-clip {
          border-radius: 1.5rem 0.5rem 1.5rem 0.5rem;
        }
      `}</style>
    </section>
  );
}
