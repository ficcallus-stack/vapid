"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import MapboxAutocomplete from "@/components/MapboxAutocomplete";
import { useState } from "react";

interface LogisticsStepProps {
  profile: any;
  handleUpdate: (field: string, value: any) => void;
  handleArrayToggle: (field: string, item: string) => void;
}

export function LogisticsStep({ profile, handleUpdate, handleArrayToggle }: LogisticsStepProps) {
  const [customInput, setCustomInput] = useState({ language: "", safety: "" });

  const isSelected = (field: string, item: string) => (profile[field] || []).includes(item);

  return (
    <div className="space-y-10 pb-10">
      {/* ── Section 1: Mobility & Reach ────────────────────────────── */}
      <section className="bg-surface-container-low/30 rounded-[3.5rem] p-8 md:p-12 border border-outline-variant/10 shadow-sm space-y-12">
        <header className="max-w-xl">
          <h3 className="font-headline text-4xl font-black text-primary italic tracking-tighter mb-3">Placement Logistics</h3>
          <p className="text-sm text-on-surface-variant italic font-medium leading-relaxed opacity-70">Define your operational boundaries and transportation infrastructure for elite attendance standards.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Primary Base Location</label>
              <div className="relative">
                <MaterialIcon name="map" className="absolute left-6 top-1/2 -translate-y-1/2 text-primary z-10" />
                <MapboxAutocomplete 
                  initialLocation={profile.location || ""} 
                  onSelect={(loc, lat, lng) => { 
                    handleUpdate("location", loc); 
                    handleUpdate("latitude", lat); 
                    handleUpdate("longitude", lng); 
                  }} 
                  placeholder="City, State (e.g. Greenwich, CT)" 
                  inputClassName="w-full bg-white border-2 border-outline-variant/10 rounded-[2rem] pl-16 pr-6 py-5 outline-none text-base font-bold text-primary shadow-sm focus:border-primary transition-all shadow-xl shadow-black/5" 
                />
              </div>
            </div>

            <div className="space-y-6 bg-white p-10 rounded-[3rem] shadow-xl shadow-primary/5 border border-outline-variant/10">
              <div className="flex justify-between items-end">
                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Max Commute Distance</label>
                <div className="text-right">
                  <span className="text-4xl font-black text-primary italic tracking-tighter">{profile.maxTravelDistance || "25"}</span>
                  <span className="text-xs font-bold text-on-surface-variant/40 italic ml-1">Miles</span>
                </div>
              </div>
              <input 
                type="range" min="5" max="100" step="5"
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-primary"
                value={profile.maxTravelDistance || 25}
                onChange={(e) => handleUpdate("maxTravelDistance", parseInt(e.target.value))}
              />
              <div className="flex items-center gap-4 bg-primary text-white p-5 rounded-2xl shadow-lg shadow-primary/20">
                 <MaterialIcon name="radar" className="text-secondary-fixed text-xl shrink-0" fill />
                 <p className="text-[10px] font-black uppercase tracking-widest leading-tight italic">
                   Active Matching Range
                   <span className="block mt-1 opacity-60 normal-case tracking-normal font-medium leading-none italic">Families within {profile.maxTravelDistance || "25"} miles see you as a priority.</span>
                 </p>
              </div>
            </div>
          </div>

          <div className="space-y-8 bg-white p-10 rounded-[3rem] shadow-xl shadow-primary/5 border border-outline-variant/10 group">
             <div className="flex items-center justify-between mb-2">
                <div>
                   <h4 className="font-headline text-2xl font-black text-primary italic leading-none truncate">Vehicle Access</h4>
                   <p className="text-[10px] text-on-surface-variant/60 font-medium italic mt-2">Required for suburban placements.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={profile.hasCar} 
                    onChange={(e) => handleUpdate("hasCar", e.target.checked)} 
                  />
                  <div className="w-16 h-9 bg-slate-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[6px] after:left-[6px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 border-2 border-transparent"></div>
                </label>
             </div>
             
             <div className={cn("space-y-6 transition-all duration-700", profile.hasCar ? "opacity-100 translate-y-0" : "opacity-30 grayscale pointer-events-none")}>
                <textarea 
                  className="w-full bg-slate-50 border-2 border-outline-variant/5 rounded-[2rem] px-8 py-6 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium leading-relaxed italic min-h-[120px]"
                  placeholder="e.g. Reliable SUV with late-model safety features. Clean driving record."
                  value={profile.carDescription || ""}
                  onChange={(e) => handleUpdate("carDescription", e.target.value)}
                />
                <div className="flex flex-col gap-3">
                   {["Valied Driver's License", "Clean DMV Record", "Mobile In Public Transit"].map(feat => {
                      const active = isSelected("logistics", feat);
                      return (
                        <button key={feat} type="button" onClick={() => handleArrayToggle("logistics", feat)} className={cn("text-left px-6 py-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all active:scale-95", active ? "bg-primary text-white border-primary shadow-lg" : "bg-white text-on-surface-variant/40 border-slate-100 uppercase opacity-60 hover:opacity-100 hover:border-primary/20")}>
                           {feat}
                           <MaterialIcon name={active ? "verified" : "add_circle"} className="text-sm opacity-50" fill={active} />
                        </button>
                      )
                   })}
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Safety & Specialist Protocols ────────────────── */}
      <section className="bg-surface-container-low/30 rounded-[3.5rem] p-8 md:p-12 border border-outline-variant/10 shadow-sm space-y-12">
        <header className="max-w-xl">
          <h3 className="font-headline text-4xl font-black text-primary italic tracking-tighter mb-3">Safety & Protocols</h3>
          <p className="text-sm text-on-surface-variant italic font-medium leading-relaxed opacity-70">Professional safety certifications and specialized enriquecimiento linguistico.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Pet Friendly & Safety Chips */}
          <div className="space-y-10">
            <div className="space-y-6">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 block mb-2">Pet Friendly Policy</label>
              <div className="flex flex-wrap gap-3">
                {["Dog Friendly", "Cat Friendly", "Comfortable with Other Pets", "No Allergies"].map(pet => {
                  const active = isSelected("logistics", pet);
                  return (
                    <button key={pet} type="button" onClick={() => handleArrayToggle("logistics", pet)} className={cn("px-6 py-4 rounded-3xl text-[10px] font-black border uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95", active ? "bg-secondary text-on-secondary border-secondary shadow-xl shadow-secondary/10" : "bg-white text-on-surface-variant/40 border-slate-100")}>
                      <MaterialIcon name="pets" className="text-sm" fill={active} />
                      {pet}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1 block mb-2">Language Enrichment</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {["Native English", "Fluent Spanish", "Bilingual", "ASL Basics", "French Proficiency"].map(lang => {
                  const active = isSelected("logistics", lang);
                  return (
                    <button key={lang} type="button" onClick={() => handleArrayToggle("logistics", lang)} className={cn("px-6 py-4 rounded-3xl text-[10px] font-black border uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95", active ? "bg-tertiary text-on-tertiary border-tertiary shadow-xl shadow-tertiary/10" : "bg-white text-on-surface-variant/40 border-slate-100")}>
                      <MaterialIcon name="language" className="text-sm" fill={active} />
                      {lang}
                    </button>
                  );
                })}
                {/* Custom Languages */}
                {profile.logistics.filter((l: string) => !["Dog Friendly", "Cat Friendly", "Comfortable with Other Pets", "No Allergies", "Native English", "Fluent Spanish", "Bilingual", "ASL Basics", "French Proficiency", "Valied Driver's License", "Clean DMV Record", "Mobile In Public Transit", "Clean Driving Record"].includes(l) && !l.includes("Protocol")).map((lang: string) => (
                  <button key={lang} type="button" onClick={() => handleArrayToggle("logistics", lang)} className="px-6 py-4 rounded-3xl text-[10px] font-black border uppercase tracking-widest flex items-center gap-3 bg-tertiary text-on-tertiary border-tertiary shadow-xl">
                    <MaterialIcon name="translate" className="text-sm" />
                    {lang}
                  </button>
                ))}
              </div>
              <div className="relative max-w-[240px]">
                <input 
                  type="text"
                  placeholder="Add another language..."
                  maxLength={24}
                  value={customInput.language}
                  onChange={(e) => setCustomInput(prev => ({ ...prev, language: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = customInput.language.trim();
                      if (val && !profile.logistics.includes(val)) {
                        handleArrayToggle("logistics", val);
                        setCustomInput(prev => ({ ...prev, language: "" }));
                      }
                    }
                  }}
                  className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none text-[10px] font-black uppercase tracking-widest focus:border-tertiary/40 transition-all italic"
                />
              </div>
            </div>
          </div>

          {/* Safety Protocols Manual Entry */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-primary/5 border border-outline-variant/10 space-y-8">
            <div>
               <h4 className="font-headline text-2xl font-black text-primary italic leading-none">Safety Protocols</h4>
               <p className="text-[10px] text-on-surface-variant/60 font-medium italic mt-2">Custom safety measures and specialized health certifications.</p>
            </div>

            <div className="space-y-4">
              {profile.logistics.filter((p: string) => p.includes("Protocol:")).map((proto: string) => (
                <div key={proto} className="flex items-center justify-between p-5 bg-error-container/20 text-error rounded-2xl border border-error/10">
                   <div className="flex items-center gap-3">
                      <MaterialIcon name="security" className="text-sm" fill />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">{proto.replace("Protocol: ", "")}</span>
                   </div>
                   <button onClick={() => handleArrayToggle("logistics", proto)} className="hover:scale-110 transition-transform">
                      <MaterialIcon name="cancel" className="text-sm opacity-40 hover:opacity-100" />
                   </button>
                </div>
              ))}

              <div className="relative pt-4">
                <input 
                   type="text"
                   placeholder="Add protocol (e.g. Epi-Pen Certified)"
                   maxLength={24}
                   value={customInput.safety}
                   onChange={(e) => setCustomInput(prev => ({ ...prev, safety: e.target.value }))}
                   onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = customInput.safety.trim();
                        if (val) {
                          handleArrayToggle("logistics", `Protocol: ${val}`);
                          setCustomInput(prev => ({ ...prev, safety: "" }));
                        }
                      }
                   }}
                   className="w-full bg-slate-50 border-2 border-outline-variant/10 rounded-[1.5rem] px-8 py-6 focus:ring-4 focus:ring-error/5 focus:border-error/40 outline-none transition-all text-sm font-medium italic"
                />
                <div className="absolute right-6 top-1/2 translate-y-1 flex items-center gap-2 pointer-events-none">
                   <span className="text-[9px] font-black text-on-surface-variant/20 uppercase tracking-widest italic">Enter to Add</span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4 bg-error/5 p-6 rounded-3xl border border-error/10">
              <MaterialIcon name="health_and_safety" className="text-error text-2xl shrink-0" fill />
              <p className="text-[10px] font-medium text-error-container font-headline italic leading-relaxed">
                 <span className="font-black uppercase tracking-widest block mb-1">Safety First Guarantee</span>
                 Protocols listed here will be featured in your public "Trust & Safety" summary for enhanced family confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Target Demographics ────────────────────────── */}
      <section className="bg-surface-container-lowest rounded-[3.5rem] p-10 md:p-14 shadow-xl border border-outline-variant/10">
        <h3 className="font-headline text-3xl font-black text-primary mb-10 italic tracking-tighter">Placement Specialty</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {["Newborns (0-3m)", "Infants (3-12m)", "Toddlers (1-3y)", "Preschool (3-5y)", "School Age (5+)"].map(age => {
            const isSelectedSpecial = isSelected("specializations", age);
            return (
              <button key={age} type="button" onClick={() => handleArrayToggle("specializations", age)} className={cn("px-6 py-10 rounded-[3rem] text-xs font-black border-2 flex flex-col items-center justify-center gap-6 transition-all active:scale-95", isSelectedSpecial ? "bg-secondary-fixed/50 text-secondary border-secondary/50 shadow-2xl scale-105" : "bg-white text-on-surface-variant/40 border-slate-50 hover:border-primary/20 hover:text-primary")}>
                <div className={cn("w-16 h-16 rounded-[1.5rem] border-2 flex items-center justify-center transition-all duration-500", isSelectedSpecial ? "border-secondary bg-secondary text-white shadow-xl rotate-3" : "border-slate-50 bg-slate-50")}>
                  <MaterialIcon name={age.includes("Newborn") ? "baby_changing_station" : age.includes("Infant") ? "child_care" : age.includes("Toddler") ? "face" : "school"} className="text-2xl" fill={isSelectedSpecial} />
                </div>
                <span className="uppercase tracking-[0.2em] text-[10px] text-center leading-tight italic">{age}</span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  );
}
