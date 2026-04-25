"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface FoundationStepProps {
  profile: any;
  handleUpdate: (field: string, value: any) => void;
  setModalConfig: (config: any) => void;
}

export function FoundationStep({ profile, handleUpdate, setModalConfig }: FoundationStepProps) {
  const isValidName = profile.fullName.trim().split(/\s+/).length >= 2;
  const isNameLocked = profile.lastNameUpdateAt ? (() => {
    const lastUpdate = new Date(profile.lastNameUpdateAt);
    const fifteenWeeksInMs = 15 * 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - lastUpdate.getTime()) < fifteenWeeksInMs;
  })() : false;

  return (
    <div className="space-y-10 pb-10">
      <section className="bg-surface-container-low/30 p-10 md:p-16 rounded-[4rem] border border-outline-variant/10 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row gap-12 items-center md:items-start">
          <div className="relative group w-40 h-40 md:w-56 md:h-56 bg-white rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white transition-all cursor-pointer flex-shrink-0 asymmetric-radius" onClick={() => {
            setModalConfig({
              isOpen: true,
              title: "Upload Profile Photo",
              acceptedTypes: "image/png, image/jpeg, image/webp",
              isMulti: false,
              onComplete: (urls: string[]) => handleUpdate("profileImageUrl", urls[0])
            })
          }}>
            <img 
              src={profile.profileImageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.fullName}`} 
              className="w-full h-full object-cover group-hover:scale-110 group-hover:blur-[2px] transition-all duration-1000"
              alt="Profile"
            />
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
               <MaterialIcon name="photo_camera" className="text-white text-3xl mb-2" />
               <span className="text-[10px] font-black uppercase text-white tracking-[0.2em] bg-black/40 px-4 py-2 rounded-full backdrop-blur-md">Change</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-10">
            <div className="space-y-4">
              <div className="flex justify-between items-end px-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic opacity-60">Legal Identity Name</label>
                {isNameLocked && (
                  <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase tracking-widest border border-amber-100 italic flex items-center gap-1.5 shadow-sm">
                    <MaterialIcon name="lock" className="text-xs" /> Lock Active
                  </span>
                )}
              </div>
              <input 
                className={cn(
                  "w-full bg-white border-none rounded-[2rem] px-10 py-6 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-headline text-3xl font-black italic tracking-tighter shadow-xl shadow-black/5 placeholder:opacity-10",
                  isNameLocked ? "opacity-60 cursor-not-allowed" : "focus:border-primary",
                  !isValidName && profile.fullName.length > 0 && "ring-2 ring-rose-500/20"
                )}
                disabled={isNameLocked}
                value={profile.fullName}
                onChange={(e) => handleUpdate("fullName", e.target.value)}
                placeholder="First & Last Name"
              />
              {!isValidName && profile.fullName.length > 0 && (
                <p className="text-[10px] font-bold text-rose-500 italic px-4 animate-in fade-in slide-in-from-top-1">Provide both names for legal verification integrity.</p>
              )}
            </div>
            <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 flex items-start gap-4">
               <MaterialIcon name="security" className="text-primary text-xl" />
               <p className="text-[11px] text-on-surface-variant italic font-medium leading-relaxed opacity-80">
                 Your full name is encrypted within the Kindred Vault. Only your first name and last initial will be visible to prospective families on the public grid.
               </p>
            </div>
          </div>
        </div>
        <MaterialIcon name="badge" className="absolute -bottom-20 -right-20 text-[25rem] text-primary opacity-[0.015] rotate-12 pointer-events-none" fill />
      </section>

      <section className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl shadow-primary/5 border border-outline-variant/10 relative overflow-hidden group">
        <div className="relative z-10">
          <header className="flex justify-between items-end mb-10">
             <div className="space-y-2">
                <h3 className="font-headline text-4xl font-black text-primary italic tracking-tighter leading-none">Professional Narrative</h3>
                <p className="text-on-surface-variant text-lg font-medium italic opacity-70">Share your child-care philosophy and what families find most striking about your presence.</p>
             </div>
             <div className="text-right">
                <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.2em] italic block mb-1">Dossier Limit</span>
                <span className="text-xl font-black text-primary italic tracking-tighter">{profile.bio?.length || 0} / 2000</span>
             </div>
          </header>
          <textarea 
            className="w-full bg-surface-container-low/50 border-none focus:ring-4 focus:ring-primary/5 rounded-[3rem] px-10 py-8 outline-none transition-all text-lg font-medium leading-relaxed text-on-surface-variant italic min-h-[300px] scrollbar-hide shadow-inner placeholder:opacity-20" 
            placeholder="I believe that every child deserves a nurturing environment that fosters curiosity..."
            value={profile.bio || ""}
            onChange={(e) => handleUpdate("bio", e.target.value)}
          />
        </div>
        <MaterialIcon name="format_quote" className="absolute -bottom-10 -right-10 text-[30rem] text-primary opacity-[0.015] -rotate-12 pointer-events-none" fill />
      </section>
    </div>
  );
}
