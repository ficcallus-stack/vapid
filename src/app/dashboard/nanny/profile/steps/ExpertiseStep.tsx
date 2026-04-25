"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface ExpertiseStepProps {
  profile: any;
  handleUpdate: (field: string, value: any) => void;
  handleArrayToggle: (field: string, item: string) => void;
}

export function ExpertiseStep({ profile, handleUpdate, handleArrayToggle }: ExpertiseStepProps) {
  return (
    <div className="space-y-10 pb-10">
      <div className="bg-surface-container-lowest rounded-[2rem] p-8 md:p-10 shadow-sm border border-outline-variant/10">
        <h3 className="font-headline text-3xl font-black mb-8 text-primary italic tracking-tighter">Professional Pedigree</h3>
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-4 space-y-3">
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Total Years Experience</label>
              <div className="relative">
                <input 
                  className={cn(
                    "w-full bg-surface-container-low border-2 border-outline-variant/10 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-primary/10 outline-none transition-all font-headline text-3xl font-black text-primary italic tracking-tighter",
                    profile.experienceYears > 50 ? "border-amber-400 bg-amber-50 shadow-lg animate-pulse" : "focus:border-primary"
                  )} 
                  type="number" min="0" max="100"
                  value={profile.experienceYears || 0}
                  onChange={(e) => handleUpdate("experienceYears", parseInt(e.target.value) || 0)}
                />
                <MaterialIcon name="history_edu" className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/10 text-4xl pointer-events-none" />
              </div>
              {profile.experienceYears > 50 && (
                <p className="text-[10px] font-black text-amber-700 italic flex items-center gap-2 animate-in zoom-in-95 duration-500 bg-amber-100/50 p-3 rounded-xl border border-amber-200">
                   <MaterialIcon name="auto_fix_high" className="text-sm" /> Is that you, Mary Poppins? 🪄 That's a legendary legacy!
                </p>
              )}
            </div>

            <div className="md:col-span-8 space-y-3">
               <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Educational Background</label>
               <textarea 
                  className="w-full bg-surface-container-low border-2 border-outline-variant/10 rounded-[1.5rem] px-6 py-5 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium leading-relaxed italic"
                  placeholder="e.g. B.S. in Early Childhood Development, NYU '18. Specialized in Montessori certification..."
                  rows={4}
                  value={profile.education || ""}
                  onChange={(e) => handleUpdate("education", e.target.value)}
               />
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1">Professional Experience Record</label>
             <p className="text-[10px] text-on-surface-variant/40 italic leading-none mb-2">Exhaustive detail about your previous placements, roles, and household integration history.</p>
             <textarea 
                className="w-full bg-surface-container-low border-2 border-outline-variant/10 rounded-[2rem] px-8 py-6 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium leading-relaxed italic min-h-[160px]"
                placeholder="Over the past decade, I have served as a lead nanny for two high-net-worth families, managing daily educational curricula and household logistics..."
                value={profile.detailedExperience || ""}
                onChange={(e) => handleUpdate("detailedExperience", e.target.value)}
             />
          </div>

          <div className="space-y-8 pt-6 border-t border-outline-variant/10">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest px-1 block mb-2">Core Competencies Mastery</label>
              <p className="text-[10px] text-on-surface-variant/40 italic leading-none mb-4">Select from our vetted standards or add your own specialized certifications.</p>
            </div>

            <div className="flex gap-3 flex-wrap">
              {["CPR/First Aid", "Newborns", "Montessori", "Reggio Emilia", "Special Needs", "Bilingual", "Sleep Training", "Potty Training", "Culinary Prep", "Water Safety", "Sign Language", "Homeschooling"].map(skill => {
                const isSelected = profile.coreSkills.includes(skill);
                const isSafety = ["CPR/First Aid", "Water Safety", "Special Needs"].includes(skill);
                return (
                  <button 
                    key={skill} 
                    type="button"
                    onClick={() => handleArrayToggle("coreSkills", skill)} 
                    className={cn(
                      "px-5 py-3 rounded-[1rem] text-[10px] font-black border uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95", 
                      isSelected 
                        ? (isSafety ? "bg-error text-on-error border-error shadow-xl shadow-error/20 scale-105" : "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105") 
                        : "bg-white text-on-surface-variant/60 border-outline-variant/30 hover:border-outline-variant/80 hover:text-primary"
                    )}
                  >
                    {skill} 
                    {isSafety && <MaterialIcon name="security" className="text-[14px]" fill={isSelected} />}
                    {isSelected && !isSafety && <MaterialIcon name="verified" className="text-[14px]" fill />}
                  </button>
                );
              })}
              
              {/* Custom Skills Display */}
              {profile.coreSkills.filter((s: string) => !["CPR/First Aid", "Newborns", "Montessori", "Reggio Emilia", "Special Needs", "Bilingual", "Sleep Training", "Potty Training", "Culinary Prep", "Water Safety", "Sign Language", "Homeschooling"].includes(s)).map((skill: string) => (
                <button 
                  key={skill} 
                  type="button"
                  onClick={() => handleArrayToggle("coreSkills", skill)} 
                  className="px-5 py-3 rounded-[1rem] text-[10px] font-black border uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105"
                >
                  {skill} <MaterialIcon name="add_task" className="text-[14px]" />
                </button>
              ))}
            </div>

            {/* Manual Entry */}
            <div className="pt-4">
              <div className="relative max-w-xs">
                <input 
                  type="text"
                  placeholder="Add custom skill (e.g. Twin Care)"
                  maxLength={24}
                  className="w-full bg-surface-container-low border-2 border-outline-variant/10 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-[10px] font-black uppercase tracking-widest italic"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.currentTarget.value || "").trim();
                      if (val && !profile.coreSkills.includes(val)) {
                        handleArrayToggle("coreSkills", val);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-on-surface-variant/20 tracking-tighter">
                  ENTER TO ADD
                </div>
              </div>
              <p className="text-[9px] text-on-surface-variant/40 italic mt-2 ml-1">Limit 24 characters to maintain editorial layout integrity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
