"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface FamilyHeaderProps {
  profile: {
    familyName: string;
    location: string;
    familyPhoto: string;
  };
  children: any[];
}

export function FamilyHomeHeader({ profile, children }: FamilyHeaderProps) {
  return (
    <header className="mb-12 space-y-10 animate-in fade-in slide-in-from-top-4 duration-1000">
      {/* 1. Location & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary/40">
            <MaterialIcon name="location_on" className="text-sm" fill />
            <span className="text-[10px] font-black tracking-[0.4em] uppercase">{profile.location || "Upper East Side, Manhattan"}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-primary italic leading-none">
            The {profile.familyName || "Henderson"} <span className="text-secondary bg-secondary/5 px-4 rounded-3xl inline-block -rotate-1">Family Home</span>
          </h1>
          <p className="text-on-surface-variant/60 font-medium italic text-lg max-w-2xl border-l-4 border-primary/5 pl-6">
            Welcome back. Everything is ready for a calm afternoon.
          </p>
        </div>
        <div className="flex gap-4">
           <button className="flex items-center gap-3 bg-surface-container-lowest px-8 py-4 rounded-2xl border border-outline-variant/15 font-black uppercase tracking-widest text-[10px] text-primary shadow-sm hover:bg-white hover:scale-105 transition-all active:scale-95">
              <MaterialIcon name="edit" className="text-lg" />
              Settings Hub
           </button>
        </div>
      </div>

      {/* 2. Portraits (The Requested Portfolio Row) */}
      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        {/* Family Portrait */}
        <div className="relative w-full lg:w-[450px] aspect-[16/10] lg:aspect-auto rounded-[3.5rem] overflow-hidden shadow-2xl premium-shadow group border-4 border-white">
          {profile.familyPhoto ? (
            <img 
              src={profile.familyPhoto} 
              alt="Family Portrait" 
              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary/10 italic">
               <MaterialIcon name="photo_camera" className="text-6xl" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>

        {/* Kids Portraits Row */}
        <div className="flex-1 bg-surface-container-low rounded-[3.5rem] p-8 flex items-center gap-8 overflow-x-auto hide-scrollbar select-none border border-outline-variant/10">
          <div className="flex gap-10 min-w-max">
            {children.map((child) => (
              <div key={child.id} className="flex flex-col items-center gap-4 group/kid">
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-xl ring-4 ring-white group-hover/kid:scale-110 group-hover/kid:rotate-6 transition-all duration-500 bg-white">
                  {child.photoUrl ? (
                    <img src={child.photoUrl} alt={child.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary/20">
                       <span className="text-2xl font-black italic">{child.name[0]}</span>
                    </div>
                  )}
                </div>
                <div className="text-center space-y-1">
                  <p className="font-headline font-black text-primary italic leading-none">{child.name.split(' ')[0]}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">{child.age}yr{child.age !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}

            <button className="flex flex-col items-center gap-4 group/add">
               <div className="w-24 h-24 rounded-full border-4 border-dashed border-outline-variant/30 flex items-center justify-center text-on-surface-variant opacity-30 group-hover/add:opacity-100 group-hover/add:border-primary transition-all">
                  <MaterialIcon name="add" className="text-3xl" />
               </div>
               <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-20 group-hover/add:opacity-40">Add Little One</p>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
