"use client";

import { useAuth } from "@/lib/auth-context";
import { MaterialIcon } from "@/components/MaterialIcon";
import { useEffect, useState, useTransition } from "react";
import { getParentProfile, updateParentProfile } from "./actions";
import { useToast } from "@/components/Toast";
import MapboxAutocomplete from "@/components/MapboxAutocomplete";
import { uploadFile } from "@/lib/actions/upload";

export default function ParentSettingsPage() {
  const { user, dbUser, signOut } = useAuth();
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Profile Draft State
  const [draft, setDraft] = useState({
    familyName: "",
    familyPhoto: "",
    location: "",
    philosophy: "",
    latitude: 0,
    longitude: 0,
    isConfirmed: false
  });

  useEffect(() => {
    getParentProfile().then(p => {
      setProfile(p);
      if (p) {
        setDraft({
          familyName: p.familyName || "",
          familyPhoto: p.familyPhoto || "",
          location: p.location || "",
          philosophy: p.philosophy || "",
          latitude: Number(p.latitude) || 0,
          longitude: Number(p.longitude) || 0,
          isConfirmed: !!p.location
        });
      }
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

  const handleSave = () => {
    if (!draft.isConfirmed) {
      showToast("Please confirm your location first.", "error");
      return;
    }
    startTransition(async () => {
      await updateParentProfile({
        familyName: draft.familyName,
        familyPhoto: draft.familyPhoto,
        location: draft.location,
        philosophy: draft.philosophy,
        latitude: draft.latitude,
        longitude: draft.longitude
      });
      showToast("Profile updated successfully!", "success");
    });
  };

  if (isLoading) return <div className="p-8 text-center animate-pulse italic font-black text-primary opacity-30">Loading Profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-12 p-8 lg:p-12 pb-32">
      <header className="space-y-2">
        <h1 className="font-headline text-4xl font-black text-primary tracking-tighter italic underline decoration-secondary decoration-4 underline-offset-8">Family Identity</h1>
        <p className="text-on-surface-variant font-medium opacity-60 italic">Manage your household profile and security preferences.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* Profile Card Sidebar */}
        <aside className="lg:col-span-1 space-y-8">
           <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-primary/5 border border-outline-variant/5 text-center flex flex-col items-center">
             <div className="w-40 h-40 rounded-[2.5rem] bg-slate-50 border-4 border-white shadow-xl mb-6 relative overflow-hidden group">
               {draft.familyPhoto ? (
                  <img src={draft.familyPhoto} alt="Family" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                    <MaterialIcon name="household" className="text-6xl" fill />
                 </div>
               )}
               {isUploading && (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                   <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                 </div>
               )}
               <input 
                 type="file" 
                 accept="image/*"
                 onChange={handlePhotoUpload}
                 className="absolute inset-0 opacity-0 cursor-pointer z-10"
                 disabled={isUploading}
               />
               <div className="absolute inset-x-0 bottom-0 bg-primary/90 text-white py-2 translate-y-full group-hover:translate-y-0 transition-transform font-black text-[9px] uppercase tracking-widest pointer-events-none">
                 Change Photo
               </div>
             </div>
             <div>
               <h3 className="text-xl font-headline font-black text-primary truncate tracking-tight">{draft.familyName || "The Family"}</h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{draft.location?.split(',')[0] || "No Location Set"}</p>
             </div>
           </div>

           <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10">
              <div className="flex items-start gap-4 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                    <MaterialIcon name="lock" className="text-white text-xl" fill />
                 </div>
                 <div>
                    <h4 className="font-headline font-black text-primary text-sm tracking-tight mb-1">Privacy Guarantee</h4>
                    <p className="text-[10px] text-primary/70 leading-relaxed font-medium">Your family photo and location are only shown to <span className="font-bold underline">Verified Nannies</span> whose applications you've accepted.</p>
                 </div>
              </div>
           </div>
        </aside>

        {/* Form Fields */}
        <main className="lg:col-span-2 space-y-10">
           <section className="bg-surface-container-lowest p-10 rounded-[3.5rem] shadow-sm space-y-8 border border-outline-variant/5">
              <div className="space-y-2">
                 <h2 className="text-2xl font-headline font-black text-primary tracking-tight">Profile Details</h2>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Family/Display Name</label>
                   <input 
                    type="text" 
                    placeholder="e.g. The Anderson Family"
                    className="w-full rounded-2xl bg-surface-container-low border-none p-5 focus:ring-2 focus:ring-primary/20 font-bold transition-all"
                    value={draft.familyName}
                    onChange={e => setDraft(prev => ({ ...prev, familyName: e.target.value }))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between ml-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Residential Area</label>
                    {draft.isConfirmed && (
                      <span className="text-[9px] font-black uppercase text-emerald-500 flex items-center gap-1">
                        <MaterialIcon name="verified" className="text-sm" /> Verified
                      </span>
                    )}
                  </div>
                  <MapboxAutocomplete 
                    initialLocation={draft.location}
                    onSelect={(loc, lat, lng) => {
                      setDraft(prev => ({ ...prev, location: loc, latitude: lat, longitude: lng, isConfirmed: false }));
                    }}
                    inputClassName="w-full rounded-2xl bg-surface-container-low border-none p-5 focus:ring-2 focus:ring-primary/20 font-bold transition-all placeholder:font-normal placeholder:opacity-40"
                    placeholder="Enter Postal Code or Area (e.g. 78701)"
                  />
                  {!draft.isConfirmed && draft.location && (
                    <button 
                      onClick={() => setDraft(prev => ({ ...prev, isConfirmed: true }))}
                      className="w-full py-4 bg-emerald-50 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                    >
                      Confirm Location: {draft.location.split(',')[0]}
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant ml-2">Family Philosophy & Values</label>
                   <textarea 
                    placeholder="e.g. We prioritize outdoor play, gentle parenting, and limited screen time..."
                    className="w-full rounded-2xl bg-surface-container-low border-none p-5 focus:ring-2 focus:ring-primary/20 font-medium transition-all min-h-[120px] resize-none"
                    value={draft.philosophy}
                    onChange={e => setDraft(prev => ({ ...prev, philosophy: e.target.value }))}
                  />
                </div>
              </div>
           </section>

           <div className="flex gap-4">
              <button
                disabled={isPending || isUploading}
                onClick={handleSave}
                className="flex-grow py-5 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded-[2rem] shadow-2xl shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? "Syncing..." : "Update Family Profile"}
              </button>
              <button
                onClick={signOut}
                className="px-8 py-5 bg-white border border-outline-variant/10 text-secondary font-black uppercase tracking-widest text-[11px] rounded-[2rem] hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2"
              >
                <MaterialIcon name="logout" className="text-lg" />
                Sign Out
              </button>
           </div>
        </main>

      </div>
    </div>
  );
}
