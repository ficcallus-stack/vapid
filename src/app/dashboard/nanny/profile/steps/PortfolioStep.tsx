"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface PortfolioStepProps {
  profile: any;
  handleUpdate: (field: string, value: any) => void;
  setModalConfig: (config: any) => void;
}

export function PortfolioStep({ profile, handleUpdate, setModalConfig }: PortfolioStepProps) {
  const photoSlots = Array.from({length: 6}).map((_, i) => profile.photos[i] || null);

  return (
    <div className="space-y-10 pb-10">
      <header className="max-w-3xl">
         <h3 className="font-headline text-5xl font-black text-primary italic tracking-tighter mb-4 leading-none text-balance">The Visual Showcase.</h3>
         <p className="text-on-surface-variant text-xl font-medium italic opacity-70 leading-relaxed">
           Families value authentic connections. High-fidelity visuals increase your matching probability by 400%.
         </p>
      </header>

      <section className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-stretch">
        {/* Intro Reel */}
        <div className="xl:col-span-5 bg-primary rounded-[4rem] p-12 shadow-2xl relative overflow-hidden flex flex-col justify-between group/reel">
           <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-14 h-14 bg-white/10 backdrop-blur-md text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl border border-white/10 group-hover/reel:rotate-6 transition-all duration-700">
                    <MaterialIcon name="videocam" className="text-2xl" fill />
                 </div>
                 <h3 className="font-headline text-3xl font-black text-white italic tracking-tighter">Public Intro Reel</h3>
              </div>
              <p className="text-[12px] font-black text-white/40 uppercase tracking-[0.3em] leading-relaxed mb-10 italic">
                A 30-second video greeting establishes immediate rapport with high-end families.
              </p>
           </div>

           <div className="relative z-10 group/preview h-[450px]">
              {profile.videoUrl ? (
                <div className="relative w-full h-full bg-black rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white/10 group/vid">
                   <video key={profile.videoUrl} className="w-full h-full object-cover grayscale-[0.5] group-hover/vid:grayscale-0 transition-all duration-1000">
                      <source src={profile.videoUrl} type="video/mp4" />
                   </video>
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-100 group-hover/vid:bg-black/10 transition-all">
                       <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/40 group-hover/vid:scale-110 transition-transform">
                          <MaterialIcon name="play_circle" className="text-white text-5xl" fill />
                       </div>
                   </div>
                   <button onClick={(e) => { e.stopPropagation(); if(confirm("Discard reel?")) handleUpdate("videoUrl", ""); }} className="absolute top-6 right-6 bg-white text-primary w-12 h-12 rounded-full flex items-center justify-center shadow-2xl scale-0 group-hover/vid:scale-100 transition-transform duration-500 hover:bg-rose-500 hover:text-white">
                      <MaterialIcon name="close" className="text-xl" />
                   </button>
                </div>
              ) : (
                <div onClick={() => setModalConfig({ isOpen: true, title: "Upload Video Intro", acceptedTypes: "video/mp4, video/quicktime, video/webm", isVideo: true, onComplete: (urls: string[]) => handleUpdate("videoUrl", urls[0]) })} className="w-full h-full border-4 border-dashed border-white/20 rounded-[3rem] flex flex-col items-center justify-center text-white/30 cursor-pointer bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all group/upload shadow-inner">
                   <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 group-hover/upload:-translate-y-4 transition-transform duration-700">
                      <MaterialIcon name="upload" className="text-5xl" />
                   </div>
                   <span className="text-[10px] uppercase font-black tracking-[0.3em] italic">Upload Intro Reel</span>
                   <span className="text-[9px] font-medium opacity-40 mt-2 italic">MP4 • MOV • Max 60MB</span>
                </div>
              )}
           </div>
           <MaterialIcon name="movie" className="absolute -right-20 -bottom-20 text-[25rem] text-white opacity-5 rotate-12 pointer-events-none group-hover/reel:scale-110 transition-transform duration-1000" fill />
        </div>

        {/* Candid Portfolio */}
        <div className="xl:col-span-7 bg-white p-12 md:p-16 rounded-[4rem] border border-outline-variant/10 shadow-2xl shadow-primary/5 flex flex-col">
           <header className="flex justify-between items-end mb-12">
              <div>
                <h3 className="font-headline text-4xl font-black text-primary italic mb-2 tracking-tighter">Candid Portfolio</h3>
                <p className="text-on-surface-variant text-lg italic font-medium opacity-70">Up to 6 captures of your professional presence.</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic block mb-1">Slots Active</span>
                <span className="text-2xl font-black text-primary italic tracking-tighter">{profile.photos?.length || 0} / 6</span>
              </div>
           </header>
           
           <div className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1">
              {photoSlots.map((url, i) => url ? (
                <div key={i} className="relative group aspect-square bg-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl cursor-pointer asymmetric-radius" onClick={() => {
                   if(confirm("Remove this capture?")) {
                      handleUpdate("photos", profile.photos.filter((p: string) => p !== url));
                   }
                }}>
                   <img src={url} className="w-full h-full object-cover group-hover:scale-110 group-hover:blur-[2px] transition-all duration-1000 ease-out" />
                   <div className="absolute inset-0 bg-rose-500/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <MaterialIcon name="delete" className="text-white text-4xl" />
                   </div>
                </div>
              ) : (
                <div key={`empty-${i}`} onClick={() => {
                  setModalConfig({
                    isOpen: true, 
                    title: `Upload Photo Vault`, 
                    acceptedTypes: "image/png, image/jpeg, image/webp",
                    isMulti: true,
                    onComplete: (newUrls: string[]) => handleUpdate("photos", [...profile.photos, ...newUrls].slice(0, 6))
                  });
                }} className="aspect-square rounded-[2.5rem] border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 hover:border-primary/40 hover:text-primary text-slate-300 cursor-pointer transition-all active:scale-95 group shadow-inner">
                   <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500">
                      <MaterialIcon name="add" className="text-2xl" />
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Open Slot</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Economics Section Integration */}
      <section className="bg-surface-container-low/30 p-12 md:p-20 rounded-[5rem] border border-outline-variant/10 relative overflow-hidden group/econ">
         <div className="relative z-10 space-y-12">
            <header className="max-w-2xl">
               <h3 className="font-headline text-5xl font-black text-primary italic tracking-tighter mb-4 leading-none">The Economics.</h3>
               <p className="text-on-surface-variant text-xl font-medium italic opacity-70 leading-relaxed">
                  Your rates should reflect your mastery. We facilitate direct negotiation with no platform commissions.
               </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8 bg-white p-12 rounded-[4rem] shadow-2xl shadow-primary/5 border border-outline-variant/5">
                  <div className="flex justify-between items-end">
                     <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] italic opacity-60">Hourly Rate</label>
                     <div className="text-right">
                        <span className="text-5xl font-black text-primary italic tracking-tighter">${profile.hourlyRate || "35"}</span>
                        <span className="text-sm font-black text-primary/40 italic ml-1">/HR</span>
                     </div>
                  </div>
                  <input 
                     type="range" min="20" max="150" step="1"
                     className="w-full accent-primary h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
                     value={profile.hourlyRate || 35}
                     onChange={(e) => handleUpdate("hourlyRate", parseInt(e.target.value))}
                  />
               </div>

               <div className="space-y-8 bg-secondary p-12 rounded-[4rem] shadow-2xl shadow-secondary/20 relative overflow-hidden">
                  <div className="flex justify-between items-end relative z-10 text-white">
                     <label className="text-[10px] font-black uppercase tracking-[0.3em] italic opacity-60">Weekly Retainer</label>
                     <div className="text-right">
                        <span className="text-5xl font-black italic tracking-tighter">${profile.weeklyRate || "1400"}</span>
                        <span className="text-sm font-black opacity-40 italic ml-1">/WK</span>
                     </div>
                  </div>
                  <input 
                     type="range" min="500" max="5000" step="50"
                     className="w-full accent-white h-2 bg-white/20 rounded-full appearance-none cursor-pointer relative z-10"
                     value={profile.weeklyRate || 1400}
                     onChange={(e) => handleUpdate("weeklyRate", parseInt(e.target.value))}
                  />
               </div>
            </div>
         </div>
         <MaterialIcon name="monetization_on" className="absolute -bottom-20 -left-20 text-[30rem] text-primary opacity-[0.01] -rotate-12 pointer-events-none" fill />
      </section>
    </div>
  );
}
