"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import MapboxAutocomplete from "@/components/MapboxAutocomplete";

interface Step1Props {
  availableChildren?: any[];
  data: any;
  updateData: (data: any) => void;
  onNext: () => void;
  onCancel: () => void;
}

export default function Step1({ availableChildren = [], data, updateData, onNext, onCancel }: Step1Props) {
  const toggleChild = (child: any) => {
    const selected = data.selectedChildrenIds || [];
    const isIn = selected.includes(child.id);
    const nextSelected = isIn ? selected.filter((id: string) => id !== child.id) : [...selected, child.id];
    
    const updates: any = {
      selectedChildrenIds: nextSelected,
      childCount: nextSelected.length > 0 ? nextSelected.length : 1
    };

    // Auto-fill existing manual structure so validation/review steps don't break!
    nextSelected.forEach((id: string, index: number) => {
      const c = availableChildren.find(x => x.id === id);
      if (c) {
        updates[`child${index + 1}Years`] = c.age;
        updates[`child${index + 1}Months`] = 0;
      }
    });

    updateData(updates);
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Main Form Section */}
      <section className="lg:col-span-8 space-y-12">
        {/* Number of Children / Children Selector */}
        <div className="space-y-6">
          <label className="text-xl font-bold font-headline text-primary block">
            {availableChildren.length > 0 ? "Which children need care?" : "How many children need care?"}
          </label>
          
          {availableChildren.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {availableChildren.map((child: any) => {
                const isSelected = (data.selectedChildrenIds || []).includes(child.id);
                return (
                  <div key={child.id} className="space-y-4">
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleChild(child)}
                      className={cn(
                        "w-full p-6 rounded-2xl border-2 transition-all active:scale-[0.98] shadow-sm text-left flex items-center gap-4",
                        isSelected
                          ? "border-primary bg-white ring-4 ring-primary/5 shadow-md"
                          : "border-outline-variant hover:border-primary-container bg-surface-container-lowest"
                      )}
                    >
                      <div className="w-12 h-12 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                        <MaterialIcon name={child.age < 2 ? "baby_changing_station" : "child_care"} className="text-2xl" />
                      </div>
                      <div className="flex-1">
                        <p className="font-headline font-bold text-primary">{child.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">{child.age} years old • {child.type}</p>
                      </div>
                      <div className={cn(
                        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected ? "border-primary bg-primary text-white" : "border-outline-variant"
                      )}>
                        {isSelected && <MaterialIcon name="check" className="text-sm" fill />}
                      </div>
                    </button>

                    {isSelected && (
                      <div className="ml-8 p-8 bg-surface-container-low/50 rounded-[2rem] border border-outline-variant/10 space-y-6 animate-in slide-in-from-top-4 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2">
                              <MaterialIcon name="medical_services" className="text-xs" />
                              Medical Notes / Health Alerts
                            </label>
                            <textarea
                              placeholder="e.g., Peanut allergy, asthma, regular medication..."
                              className="w-full bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-3 px-4 text-sm font-medium text-primary shadow-sm min-h-[80px]"
                              value={data[`child_${child.id}_medical`] ?? child.medicalNotes ?? ""}
                              onChange={(e) => updateData({ [`child_${child.id}_medical`]: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-primary/60 ml-1 flex items-center gap-2">
                              <MaterialIcon name="auto_awesome" className="text-xs" />
                              Interests & Likings
                            </label>
                            <textarea
                              placeholder="e.g., Legos, Dinosaurs, Bedtime stories about space..."
                              className="w-full bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-3 px-4 text-sm font-medium text-primary shadow-sm min-h-[80px]"
                              value={data[`child_${child.id}_interests`] ?? (Array.isArray(child.interests) ? child.interests.join(", ") : child.interests) ?? ""}
                              onChange={(e) => updateData({ [`child_${child.id}_interests`]: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3, "4+"].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => updateData({ childCount: num })}
                  className={cn(
                    "px-8 py-4 rounded-xl border-2 transition-all active:scale-95 shadow-sm",
                    data.childCount === num
                      ? "border-primary text-primary font-bold bg-surface-container-lowest"
                      : "border-outline-variant text-on-surface-variant font-medium hover:border-primary-container hover:text-primary bg-surface-container-lowest"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ages/Details of Children (only show if using manual count) */}
        {availableChildren.length === 0 && (
          <div className="space-y-6">
            <label className="text-xl font-bold font-headline text-primary block flex items-center gap-3">
              Family composition
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 italic">Manual Entry</span>
            </label>
            <div className="space-y-6">
              {Array.from({ length: typeof data.childCount === 'number' ? data.childCount : 4 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-outline-variant/10 animate-in fade-in slide-in-from-bottom-4 duration-500 hover:border-primary/20 transition-all relative group">
                  <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-primary rotate-3 transition-transform group-hover:rotate-0">
                            <MaterialIcon name="child_care" className="text-2xl" />
                         </div>
                         <div>
                            <h4 className="font-headline font-black text-primary italic text-xl">Child {i + 1}</h4>
                            <p className="text-[10px] font-black text-on-surface-variant/20 uppercase tracking-[0.2em]">Manual Profile Context</p>
                         </div>
                      </div>
                   </div>
                   
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Years</label>
                       <input
                         className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-3.5 px-5 font-bold text-primary shadow-inner"
                         placeholder="0"
                         type="number"
                         value={data[`child${i + 1}Years`] || ""}
                         onChange={(e) => updateData({ [`child${i + 1}Years`]: e.target.value })}
                       />
                    </div>
                    <div className="space-y-2 text-left">
                       <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1">Months</label>
                       <input
                         className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-3.5 px-5 font-bold text-primary shadow-inner"
                         placeholder="0"
                         type="number"
                         value={data[`child${i + 1}Months`] || ""}
                         onChange={(e) => updateData({ [`child${i + 1}Months`]: e.target.value })}
                       />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 flex items-center gap-2">
                        <MaterialIcon name="medical_services" className="text-xs" />
                        Medical / Allergies
                      </label>
                      <input
                        className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-3.5 px-5 font-bold text-primary shadow-inner"
                        placeholder="Any health notes..."
                        value={data[`child${i + 1}Medical`] || ""}
                        onChange={(e) => updateData({ [`child${i + 1}Medical`]: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 ml-1 flex items-center gap-2">
                      <MaterialIcon name="auto_awesome" className="text-xs" />
                      Interests (e.g., Legos, Dinosaurs, stories)
                    </label>
                    <input
                      className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-3.5 px-5 font-bold text-primary shadow-inner"
                      placeholder="What does your child love?"
                      value={data[`child${i + 1}Interests`] || ""}
                      onChange={(e) => updateData({ [`child${i + 1}Interests`]: e.target.value })}
                    />
                  </div>
                  
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-10 group-hover:scale-125 transition-transform duration-700"></div>
                </div>
              ))}
              {(typeof data.childCount !== 'number' || data.childCount < 4) && (
                <button
                  type="button"
                  onClick={() => updateData({ childCount: Math.min((typeof data.childCount === 'number' ? data.childCount : 4) + 1, 4) })}
                  className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] border-2 border-dashed border-outline-variant/20 text-on-surface-variant hover:text-primary hover:border-primary/40 hover:bg-primary/5 transition-all group min-h-[160px]"
                >
                  <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center group-hover:rotate-90 transition-transform">
                     <MaterialIcon name="add" className="text-2xl" />
                  </div>
                  <span className="font-headline font-black uppercase tracking-widest text-[10px]">Add another child</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Hiring Mode / Economy Selector */}
        <div className="space-y-6">
          <label className="text-xl font-bold font-headline text-primary block flex items-center gap-2">
            Hiring Model
            <span className="text-[10px] font-black uppercase tracking-widest text-secondary px-2 py-0.5 rounded-full bg-secondary/10 border border-secondary/20">Recommended</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <button
                type="button"
                onClick={() => updateData({ hiringType: "retainer", minRate: 20, maxRate: 35 })}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                  data.hiringType === "retainer" ? "border-secondary bg-secondary/5 ring-4 ring-secondary/5" : "border-outline-variant hover:border-secondary/40 bg-surface-container-lowest"
                )}
             >
                <div className="flex items-center gap-4 mb-4">
                   <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm", data.hiringType === "retainer" ? "bg-secondary text-white" : "bg-primary/5 text-primary")}>
                      <MaterialIcon name="verified_user" fill={data.hiringType === "retainer"} />
                   </div>
                   <div>
                      <p className="font-headline font-black text-primary italic leading-none mb-1">Weekly Retainer</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-secondary italic">Dedicated Growth</p>
                   </div>
                </div>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">
                   Secure a dedicated caregiver for recurring stability. Best for long-term household integration and priority support.
                </p>
                {data.hiringType === "retainer" && (
                   <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 rounded-full bg-secondary text-white flex items-center justify-center">
                         <MaterialIcon name="check" className="text-sm" fill />
                      </div>
                   </div>
                )}
             </button>

             <button
                type="button"
                onClick={() => updateData({ hiringType: "hourly" })}
                className={cn(
                  "p-6 rounded-2xl border-2 transition-all text-left relative overflow-hidden",
                  data.hiringType === "hourly" ? "border-primary bg-primary/5 ring-4 ring-primary/5" : "border-outline-variant hover:border-primary/40 bg-surface-container-lowest"
                )}
             >
                <div className="flex items-center gap-4 mb-4">
                   <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm", data.hiringType === "hourly" ? "bg-primary text-white" : "bg-primary/5 text-primary")}>
                      <MaterialIcon name="bolt" fill={data.hiringType === "hourly"} />
                   </div>
                   <div>
                      <p className="font-headline font-black text-primary italic leading-none mb-1">One-time Hourly</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 italic">Spot/Emergency</p>
                   </div>
                </div>
                <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic">
                   Post for a specific date or emergency gap. Caregivers are available on-demand but do not provide recurring exclusivity.
                </p>
                {data.hiringType === "hourly" && (
                   <div className="absolute top-4 right-4">
                      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                         <MaterialIcon name="check" className="text-sm" fill />
                      </div>
                   </div>
                )}
             </button>
          </div>
        </div>

        {/* Urgency / Fast-Track Ticker */}
        <div className="bg-surface-container-low p-8 rounded-[2rem] border border-outline-variant/10 shadow-inner group transition-all hover:bg-white/50">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-xl shadow-orange-600/10 group-hover:scale-110 transition-transform">
                    <MaterialIcon name="speed" className="text-3xl" fill />
                 </div>
                 <div>
                    <h4 className="font-headline font-black text-primary italic leading-none mb-2">Fast-Track Placement</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 leading-relaxed italic">
                       Need care within 4 hours? <br/>
                       Enable priority dispatch for $10 extra.
                    </p>
                 </div>
              </div>
              <button 
                type="button"
                onClick={() => updateData({ isFastTrack: !data.isFastTrack })}
                className={cn(
                  "px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-3 italic",
                  data.isFastTrack ? "bg-orange-600 text-white shadow-xl shadow-orange-600/30 ring-4 ring-orange-500/10" : "bg-white text-on-surface-variant border border-outline-variant hover:border-orange-600 hover:text-orange-600 shadow-sm"
                )}
              >
                 {data.isFastTrack ? "ACTIVE: PRIORITY" : "ACTIVATE NOW"}
                 <MaterialIcon name={data.isFastTrack ? "check_circle" : "bolt"} className="text-sm" fill={data.isFastTrack} />
              </button>
           </div>
        </div>

        {/* Duration / Cycle Duration Chips */}
        <div className="space-y-6">
          <label className="text-xl font-bold font-headline text-primary block">
            {data.hiringType === 'retainer' ? 'Cycle Duration' : 'Preferred duration'}
          </label>
          <div className="flex flex-wrap gap-3">
            {(data.hiringType === 'retainer' ? ["Recurring Weekly", "Bi-Weekly", "Monthly"] : ["Full-time", "Part-time", "One-time"]).map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => updateData({ duration })}
                className={cn(
                  "px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-sm italic",
                  data.duration === duration
                    ? "bg-primary text-white scale-105 shadow-xl shadow-primary/20"
                    : "bg-surface-container-high text-on-surface-variant hover:bg-primary-container hover:text-primary"
                )}
              >
                {duration}
              </button>
            ))}
          </div>

          {/* Smart Recommendation for Retainer Model */}
          {(data.duration === "Full-time" || data.duration === "Part-time") && data.hiringType !== "retainer" && (
             <div className="bg-secondary/10 border border-secondary/20 p-6 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-left duration-700">
                <div className="w-14 h-14 bg-secondary text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-secondary/20">
                   <MaterialIcon name="auto_awesome" className="text-2xl" />
                </div>
                <div className="flex-1">
                   <h4 className="font-headline font-black text-secondary italic leading-none mb-1">Scale for Stability</h4>
                   <p className="text-xs text-on-surface-variant font-medium leading-relaxed">
                      Based on your "{data.duration}" selection, a **Weekly Retainer** is recommended. You'll attract higher-quality caregivers seeking consistent work.
                   </p>
                </div>
                   <button 
                  onClick={() => updateData({ hiringType: "retainer", minRate: 20, maxRate: 35 })}
                  className="px-6 py-3 bg-secondary text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:scale-105 active:scale-95 transition-all shadow-md"
                >
                   Switch to Retainer
                </button>
             </div>
          )}
        </div>

        {/* NEW SECTION: Location & Start/End Dates */}
        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] border border-outline-variant/10 shadow-sm relative overflow-hidden group space-y-8">
           <div className="space-y-4 relative z-20 w-full">
              <label className="text-sm font-black uppercase tracking-widest text-primary italic flex items-center gap-2">
                 <MaterialIcon name="location_on" className="text-lg" />
                 Job Location
              </label>
              <MapboxAutocomplete
                initialLocation={data.location || ""}
                onSelect={(loc: string, lat: number, lng: number) => updateData({ location: loc, latitude: lat, longitude: lng })}
                placeholder="Enter address or zip code..."
                inputClassName="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-4 px-5 font-bold text-primary shadow-inner"
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full relative z-10">
              <div className="space-y-4">
                 <label className="text-sm font-black uppercase tracking-widest text-primary italic flex items-center gap-2">
                    <MaterialIcon name="calendar_month" className="text-lg" />
                    Target Start Date
                 </label>
                 <input
                   type="date"
                   value={data.startDate || ""}
                   onChange={(e) => updateData({ startDate: e.target.value })}
                   className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-4 px-5 font-bold text-primary shadow-inner [color-scheme:light]"
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-sm font-black uppercase tracking-widest text-primary italic flex items-center gap-2">
                    <MaterialIcon name="event_busy" className="text-lg" />
                    Target End Date
                 </label>
                 <div className="relative group">
                    <input
                      type="date"
                      value={data.endDate || ""}
                      onChange={(e) => updateData({ endDate: e.target.value })}
                      className="w-full bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary/40 py-4 px-5 font-bold text-primary shadow-inner [color-scheme:light]"
                    />
                    {!data.endDate && (
                      <div className="absolute top-1/2 right-4 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                         <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 italic">or Ongoing</span>
                      </div>
                    )}
                 </div>
              </div>
           </div>
           
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -z-0 group-hover:scale-110 transition-transform duration-1000"></div>
        </div>

      </section>

      {/* Sidebar Reassurance */}
      <aside className="lg:col-span-4 space-y-8">
        <div className="bg-primary p-8 rounded-2xl text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-secondary-fixed-dim/20 rounded-2xl flex items-center justify-center">
              <MaterialIcon name="verified_user" className="text-secondary-fixed-dim text-4xl" fill />
            </div>
            <h3 className="text-2xl font-bold font-headline leading-tight">
              Your family's safety is our priority
            </h3>
            <p className="text-primary-fixed/80 text-sm leading-relaxed">
              Every caregiver on Kindred Care undergoes a rigorous 10-step vetting process including
              criminal background checks and identity verification.
            </p>
            <ul className="space-y-4">
              {[
                "100% Background Checked",
                "Identity Verification",
                "Reference Audits",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <MaterialIcon name="check_circle" className="text-tertiary-fixed text-xl" />
                  <span className="text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-surface-container-low p-8 rounded-2xl border-l-4 border-secondary">
          <p className="text-on-surface-variant italic mb-6 leading-relaxed">
            "Finding a nanny who truly felt like part of the family seemed impossible until Kindred
            Care. The process was so thorough and reassuring."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
              <img
                alt="Sarah J."
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2nyDmGpyDdT_g6Eu88Eq49BAWfcS5-O5Cm2hM8mYNkQIWjxjqnpSEuogSDXSdVhHMwvMyz27OVBm7TQ2GkOrGXirxhhKtFo4u_2w5BZvnN_g3Bk2yX70xO3cbHhWsfuCU_u15HanHhLbndwPVclDVCphaH05HwAJEZln44iQ9Y_Zdm0B8yNp51o23yv25PRgFSLRFXV8oXtXAyaMuPBiy-BCsMjpCbzsMEihKByHJkJkV_w8zo5mq4Eyz6AhXRkcn2H2xCnQsYUs"
              />
            </div>
            <div>
              <p className="font-bold text-primary">Sarah Jenkins</p>
              <p className="text-xs text-on-surface-variant">Member since 2022</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
