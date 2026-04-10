"use client";

import { useAuth } from "@/lib/auth-context";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useEffect, useState, useTransition } from "react";
import { getParentProfile, updateParentProfile, generateFamilyIllustration } from "./actions";
import { getChildren, addChild, removeChild, addChildrenBatch } from "../children/actions";
import { useToast } from "@/components/Toast";
import MapboxAutocomplete from "@/components/MapboxAutocomplete";
import { uploadFile } from "@/lib/actions/upload";
import { cn } from "@/lib/utils";

export default function ParentSettingsPage() {
  const { user, signOut } = useAuth();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Profile Draft State
  const [draft, setDraft] = useState({
    familyName: "",
    familyPhoto: "",
    location: "",
    philosophy: "",
    parentDescription: "",
    partnerDescription: "",
    latitude: 0,
    longitude: 0,
    isConfirmed: false
  });

  const [kids, setKids] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getParentProfile(), getChildren()]).then(([p, k]) => {
      if (p) {
        setDraft({
          familyName: p.familyName || "",
          familyPhoto: p.familyPhoto || "",
          location: p.location || "",
          philosophy: p.philosophy || "",
          parentDescription: (p as any).parentDescription || "",
          partnerDescription: (p as any).partnerDescription || "",
          latitude: Number(p.latitude) || 0,
          longitude: Number(p.longitude) || 0,
          isConfirmed: !!p.location
        });
      }
      setKids(k || []);
      setIsLoading(false);
    });
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadFile(formData);
      setDraft(prev => ({ ...prev, familyPhoto: res.url }));
      showToast("Family photo uploaded!", "success");
    } catch (err) {
      showToast("Upload failed.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!draft.parentDescription || !draft.partnerDescription || kids.some(k => !k.bio)) {
      showToast("Please fill in all descriptions (Parents & Kids) to generate an accurate portrait.", "info");
      return;
    }

    setIsAiGenerating(true);
    try {
      // Auto-save descriptions first before generating
      await updateParentProfile(draft);
      
      const res = await generateFamilyIllustration();
      setDraft(prev => ({ ...prev, familyPhoto: res.url }));
      showToast("Family illustration generated!", "success");
    } catch (err: any) {
      showToast(err.message || "AI generation failed.", "error");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateParentProfile(draft);
        showToast("Profile updated successfully!", "success");
      } catch (err) {
        showToast("Failed to save profile.", "error");
      }
    });
  };

  const handleAddKid = async () => {
    const newKid = {
      name: "New Child",
      age: 0,
      type: "INFANT",
      bio: "",
      interests: [],
    };
    try {
      // Add remotely first to get ID
      const res = await addChild(newKid as any);
      if (res.success) {
        const freshKids = await getChildren();
        setKids(freshKids);
        showToast("Child added to portfolio", "success");
      }
    } catch (err) {
      showToast("Failed to add child", "error");
    }
  };

  const handleRemoveKid = async (id: string) => {
    if (!confirm("Are you sure you want to remove this child profile?")) return;
    try {
      await removeChild(id);
      setKids(prev => prev.filter(k => k.id !== id));
      showToast("Child removed", "info");
    } catch (err) {
      showToast("Failed to remove child", "error");
    }
  };

  const canGenerate = !!draft.parentDescription && !!draft.partnerDescription && kids.length > 0 && kids.every(k => (k.bio?.length || 0) > 10);

  if (isLoading) return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
          <p className="font-headline font-black text-white italic opacity-40">Synchronizing Family Hub...</p>
       </div>
    </div>
  );

  return (
    <main className="relative z-10 flex min-h-screen items-center justify-center p-4 md:p-8 bg-surface">
      <div className="w-full max-w-7xl bg-surface-container-lowest shadow-2xl rounded-[3rem] overflow-hidden flex flex-col lg:flex-row min-h-[850px] border border-outline-variant/10">
        
        {/* Left Column: Family Brand */}
        <section className="w-full lg:w-[42%] bg-primary-container p-8 lg:p-14 text-on-primary-container flex flex-col relative overflow-hidden group">
          {/* Animated Background Element */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-container/10 rounded-full blur-[100px] -z-0 group-hover:scale-110 transition-transform duration-1000"></div>
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="mb-10 flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                <MaterialIcon name="family_home" className="text-secondary-fixed-dim text-2xl" fill />
              </div>
              <div>
                <h2 className="font-headline text-3xl font-black italic tracking-tighter text-white leading-none">Family Home</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mt-2">Identity & Philosophy</p>
              </div>
            </div>

            <div className="space-y-10 flex-grow">
              {/* Portrait Uploader */}
              <div className="relative group/portrait">
                <div className="aspect-[4/5] w-full bg-primary overflow-hidden rounded-[2.5rem] shadow-2xl border border-white/5 relative">
                   {draft.familyPhoto ? (
                      <img className="w-full h-full object-cover opacity-90 group-hover/portrait:opacity-100 transition-all duration-700 group-hover/portrait:scale-105" src={draft.familyPhoto} alt="Family Portrait" />
                   ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-white/10 italic">
                         <MaterialIcon name="household" className="text-8xl mb-4" />
                         <p className="font-black uppercase tracking-widest text-xs">No Portrait Set</p>
                      </div>
                   )}
                   
                   {/* Upload Overlay */}
                   <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 translate-y-full group-hover/portrait:translate-y-0 transition-transform duration-500">
                      <div className="flex gap-2">
                        <label className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-xl text-white py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-center cursor-pointer transition-all active:scale-95">
                           Upload Photo
                           <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
                        </label>
                      </div>
                   </div>

                   {(isUploading || isAiGenerating) && (
                      <div className="absolute inset-0 bg-primary/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                         <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                         <p className="text-white font-black uppercase text-[10px] tracking-widest animate-pulse">
                            {isAiGenerating ? "Generating Masterpiece..." : "Uploading..."}
                         </p>
                      </div>
                   )}
                </div>
                
                <button 
                  onClick={handleGenerateAI}
                  disabled={isAiGenerating || isUploading}
                  className={cn(
                    "absolute top-6 right-6 backdrop-blur-2xl px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95 shadow-2xl border border-white/10",
                    canGenerate 
                      ? "bg-secondary-fixed-dim text-on-secondary-fixed hover:bg-white hover:text-primary" 
                      : "bg-white/5 text-white/40 cursor-not-allowed"
                  )}
                >
                  <MaterialIcon name="magic_button" className={cn("text-lg", canGenerate && "animate-spin-slow")} fill={canGenerate} />
                  {isAiGenerating ? "Magic in progress..." : "Generate with AI"}
                </button>
              </div>

              {/* Identity Inputs */}
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Family Title</label>
                    <input 
                      className="w-full bg-white/5 border-none rounded-2xl py-4 px-5 text-white font-headline text-lg font-bold focus:ring-2 focus:ring-secondary-fixed-dim placeholder:text-white/10 transition-all" 
                      placeholder="e.g. The Sterlings"
                      value={draft.familyName}
                      onChange={e => setDraft(prev => ({ ...prev, familyName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Location</label>
                    <MapboxAutocomplete 
                      initialLocation={draft.location}
                      onSelect={(loc, lat, lng) => setDraft(prev => ({ ...prev, location: loc, latitude: lat, longitude: lng }))}
                      inputClassName="w-full bg-white/5 border-none rounded-2xl py-4 px-5 text-white text-sm focus:ring-2 focus:ring-secondary-fixed-dim"
                      placeholder="Brooklyn, NY"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary-fixed-dim ml-1">Parent (You)</label>
                        <input 
                          className="w-full bg-transparent border-b border-white/10 focus:border-secondary-fixed-dim text-sm text-white py-2 outline-none transition-all italic font-medium"
                          placeholder="e.g. Tall, bearded, dark hair, glasses"
                          value={draft.parentDescription}
                          onChange={e => setDraft(prev => ({ ...prev, parentDescription: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-secondary-fixed-dim ml-1">Partner</label>
                        <input 
                          className="w-full bg-transparent border-b border-white/10 focus:border-secondary-fixed-dim text-sm text-white py-2 outline-none transition-all italic font-medium"
                          placeholder="e.g. Athletic, blonde, green eyes"
                          value={draft.partnerDescription}
                          onChange={e => setDraft(prev => ({ ...prev, partnerDescription: e.target.value }))}
                        />
                      </div>
                   </div>

                   <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">Philosophy</label>
                    <textarea 
                      className="w-full bg-white/5 border-none rounded-[2rem] py-5 px-6 text-white text-sm focus:ring-2 focus:ring-secondary-fixed-dim resize-none min-h-[100px] italic leading-relaxed" 
                      placeholder="We believe in creative exploration through art and daily outdoor play..."
                      value={draft.philosophy}
                      onChange={e => setDraft(prev => ({ ...prev, philosophy: e.target.value }))}
                    />
                   </div>
                </div>
              </div>
            </div>

            <div className="pt-12 flex gap-4 mt-auto">
              <button 
                onClick={handleSave}
                disabled={isPending}
                className="flex-1 bg-secondary-fixed-dim text-on-secondary-fixed font-black uppercase tracking-widest text-xs py-5 rounded-2xl shadow-2xl hover:bg-white hover:text-primary transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isPending ? "Syncing..." : "Save Family Profile"}
              </button>
              <button 
                onClick={signOut}
                className="p-5 bg-white/5 rounded-2xl text-white hover:bg-white/10 transition-all group/logout"
              >
                <MaterialIcon name="logout" className="group-hover:rotate-12 transition-transform" />
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: Kids Portfolio */}
        <section className="w-full lg:w-[58%] p-8 lg:p-14 bg-surface-container-low overflow-y-auto max-h-[850px] space-y-12">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-4xl font-black text-primary italic tracking-tight underline decoration-secondary decoration-4 underline-offset-8">Kids Portfolio</h3>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 mt-4 leading-none">Developmental Profiles</p>
            </div>
            <button 
              onClick={handleAddKid}
              className="flex items-center gap-3 bg-primary text-white font-black uppercase tracking-widest text-[10px] px-6 py-4 rounded-2xl shadow-xl shadow-primary/10 hover:-translate-y-1 transition-all active:scale-95"
            >
              <MaterialIcon name="add_circle" className="text-lg" />
              Add Child
            </button>
          </div>

          <div className="space-y-8">
            {kids.map((kid) => (
              <div key={kid.id} className="bg-surface-container-lowest p-8 rounded-[3rem] shadow-sm border border-outline-variant/10 flex flex-col md:flex-row gap-8 items-start transition-all hover:shadow-xl hover:shadow-primary/5 group/card border-l-[12px] border-primary">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-surface-container flex-shrink-0 shadow-inner group-hover/card:rotate-3 transition-transform duration-700">
                   {kid.photoUrl ? (
                      <img className="w-full h-full object-cover" src={kid.photoUrl} alt={kid.name} />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary/10">
                         <MaterialIcon name="child_care" className="text-5xl" />
                      </div>
                   )}
                </div>
                
                <div className="flex-grow space-y-6 w-full">
                  <div className="flex justify-between items-start w-full">
                    <div className="grid grid-cols-2 gap-6 w-full pr-8">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Legal Name</label>
                          <input 
                            className="w-full border-b-2 border-transparent bg-transparent py-1 text-on-surface font-headline font-black text-xl italic focus:border-primary outline-none transition-all placeholder:font-normal placeholder:opacity-20" 
                            placeholder="Leo Sterling"
                            value={kid.name}
                            onChange={(e) => {
                               const updated = [...kids];
                               updated.find(k => k.id === kid.id).name = e.target.value;
                               setKids(updated);
                            }}
                          />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Age / Category</label>
                          <div className="flex items-center gap-3">
                            <input 
                              className="w-16 border-b-2 border-transparent bg-transparent py-1 text-on-surface font-headline font-black text-xl italic focus:border-primary outline-none" 
                              type="number"
                              value={kid.age}
                              onChange={(e) => {
                                const updated = [...kids];
                                updated.find(k => k.id === kid.id).age = e.target.value;
                                setKids(updated);
                             }}
                            />
                            <span className="bg-primary/5 text-primary text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{kid.type}</span>
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveKid(kid.id)}
                      className="text-on-surface-variant/20 hover:text-error transition-colors p-2"
                    >
                      <span className="material-symbols-outlined text-2xl">delete</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-40">Developmental Brief (Required for AI)</label>
                      <textarea 
                        className="w-full bg-surface-container border-none rounded-2xl px-5 py-4 text-sm text-on-surface-variant font-medium placeholder:opacity-30 focus:ring-2 focus:ring-primary/10 resize-none italic"
                        rows={2}
                        placeholder="Curly hair, energetic, loves dinosaurs and blue shirts..."
                        value={kid.bio || ""}
                        onChange={(e) => {
                           const updated = [...kids];
                           updated.find(k => k.id === kid.id).bio = e.target.value;
                           setKids(updated);
                        }}
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {kid.interests?.map((interest: string, idx: number) => (
                        <span key={idx} className="bg-primary/5 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                           {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {kids.length === 0 && (
              <div 
                onClick={handleAddKid}
                className="border-4 border-dashed border-outline-variant/20 p-20 rounded-[3rem] flex flex-col items-center justify-center text-on-surface-variant opacity-30 hover:opacity-100 transition-all cursor-pointer group hover:bg-primary/5 hover:border-primary/20"
              >
                <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <MaterialIcon name="child_care" className="text-4xl text-primary" />
                </div>
                <p className="font-black uppercase tracking-widest text-sm">Add your first family member</p>
                <p className="text-xs italic mt-2 opacity-60">Build your tribe to find the perfect match</p>
              </div>
            )}
          </div>

          {/* Guidelines Banner */}
          <div className="p-10 bg-tertiary-fixed/10 rounded-[3rem] border border-tertiary-fixed/20 relative overflow-hidden group">
            <div className="relative z-10 flex gap-6 items-start">
              <div className="w-14 h-14 bg-white/50 rounded-2xl flex items-center justify-center shadow-sm backdrop-blur-md">
                <MaterialIcon name="verified_user" className="text-tertiary text-3xl" fill />
              </div>
              <div className="space-y-3">
                <h4 className="font-headline font-black text-2xl text-tertiary italic tracking-tight">Trust & Safety Blueprint</h4>
                <p className="text-sm text-on-tertiary-fixed-variant leading-relaxed font-medium opacity-80 italic">
                  Profiles with high-fidelity portraits and detailed household briefs are <strong className="text-tertiary underline decoration-2 underline-offset-4">4.2x more likely</strong> to receive interest from Tier-1 caregivers. Your details are encrypted and shared only with verified professionals you approve.
                </p>
              </div>
            </div>
            {/* Background Icon */}
            <div className="absolute -right-10 -bottom-10 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <MaterialIcon name="shield_with_heart" className="text-[12rem]" fill />
            </div>
          </div>
        </section>
      </div>
      
      {/* Styles for squircle if not available in tailwind (though rounded-3xl is close) */}
      <style jsx>{`
        .squircle {
          border-radius: 24% 24% 24% 24% / 24% 24% 24% 24%;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </main>
  );
}
