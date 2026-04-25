"use client";

import { useState, useEffect } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { initBookingAction } from "@/lib/actions/booking-actions";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { useToast } from "@/components/Toast";
import MapboxAutocomplete from "@/components/MapboxAutocomplete";
import { calculateInstantRate, isInstantBooking } from "@/lib/pricing-utils";

interface ChildProfile {
  id: string;
  name: string;
  age: number;
}

interface ScheduleStepProps {
  user: any;
  nanny: {
    id: string;
    name: string;
    hourlyRate: string;
    weeklyRate: string;
    availability: any;
    profileImage: string;
    isVerified: boolean;
    experienceYears: number;
  };
  childrenList: ChildProfile[];
}

const INTERVALS = [
  { id: 0, label: "00-04", name: "Midnight", icon: "bedtime" },
  { id: 1, label: "04-08", name: "Early AM", icon: "wb_twilight" },
  { id: 2, label: "08-12", name: "Morning", icon: "wb_sunny" },
  { id: 3, label: "12-16", name: "Afternoon", icon: "sunny" },
  { id: 4, label: "16-20", name: "Evening", icon: "wb_cloudy" },
  { id: 5, label: "20-00", name: "Night", icon: "nights_stay" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ScheduleStep({ user, nanny, childrenList }: ScheduleStepProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  // Configuration State
  const [hiringMode, setHiringMode] = useState<"hourly" | "retainer">("hourly");
  const [isDetailed, setIsDetailed] = useState(false);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("09:00");
  
  // Custom Pulse Grid: dayIndex_intervalId (e.g. "1_2" = Monday Morning)
  const [pulseGrid, setPulseGrid] = useState<Record<string, boolean>>({});

  const [selectedChildIds, setSelectedChildIds] = useState<string[]>([]);
  const [manualChildCount, setManualChildCount] = useState(0);
  const [noteToNanny, setNoteToNanny] = useState("");
  const [clashStatus, setClashStatus] = useState<{ hasClash: boolean; conflicts: any[] } | null>(null);

  // Safety & Location State
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [emergencyName, setEmergencyName] = useState(user?.emergencyContactName || "");
  const [emergencyPhone, setEmergencyPhone] = useState(user?.emergencyContactPhone || "");
  const [bookingLocation, setBookingLocation] = useState(user?.location || "");
  const [locationDescription, setLocationDescription] = useState("");

  const hourlyRate = parseFloat(nanny.hourlyRate);
  const weeklyRate = parseFloat(nanny.weeklyRate);
  const totalChildren = selectedChildIds.length + manualChildCount;
  
  // Calculations
  const calculateTotal = () => {
    let subtotalValue = 0;
    const extraChildren = Math.max(0, totalChildren - 1);
    
    // Pricing Constants
    const EXTRA_CHILD_HOURLY = 5;
    const EXTRA_CHILD_WEEKLY = 150;
    const STRIPE_FEE_RATE = 0.029;
    const KINDRED_FEE_RATE = 0.046;

    const isInstant = isInstantBooking(startDate, startTime);
    const activeHourlyRate = isInstant ? calculateInstantRate(hourlyRate) : hourlyRate;

    if (hiringMode === "retainer") {
      const activeWeeklyRate = isInstant ? calculateInstantRate(weeklyRate) : weeklyRate;
      subtotalValue = activeWeeklyRate + (extraChildren * EXTRA_CHILD_WEEKLY);
    } else {
      const selectedChunksCount = Object.values(pulseGrid).filter(Boolean).length;
      const hours = selectedChunksCount * 4;
      subtotalValue = (hours * activeHourlyRate) + (selectedChunksCount * extraChildren * 4 * EXTRA_CHILD_HOURLY);
    }

    const stripeFee = subtotalValue * STRIPE_FEE_RATE;
    const kindredFee = subtotalValue * KINDRED_FEE_RATE;
    const total = subtotalValue + stripeFee + kindredFee;

    return {
      subtotal: subtotalValue,
      stripeFee,
      kindredFee,
      total,
      extraChildPremium: extraChildren * (hiringMode === "hourly" ? EXTRA_CHILD_HOURLY * (Object.values(pulseGrid).filter(Boolean).length * 4) : EXTRA_CHILD_WEEKLY),
      totalHours: hiringMode === "hourly" ? (Object.values(pulseGrid).filter(Boolean).length * 4) : 40,
      isInstant 
    };
  };

  const { subtotal, stripeFee, kindredFee, total, extraChildPremium, totalHours, isInstant } = calculateTotal();

  const handleChildToggle = (id: string) => {
    setSelectedChildIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const togglePulseChunk = (day: number, intervalId: number) => {
    const key = `${day}_${intervalId}`;
    setPulseGrid(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSimpleShift = (day: number, mode: "day" | "night") => {
    const chunks = mode === "day" ? [2, 3] : [4, 5]; 
    const newGrid = { ...pulseGrid };
    const allSet = chunks.every(idx => newGrid[`${day}_${idx}`]);
    chunks.forEach(idx => {
       const key = `${day}_${idx}`;
       if (allSet) delete newGrid[key];
       else newGrid[key] = true;
    });
    setPulseGrid(newGrid);
  };

  const switchToDetailed = () => {
     setPulseGrid({}); 
     setIsDetailed(true);
  };

  const switchToSimple = () => {
     setPulseGrid({}); 
     setIsDetailed(false);
  };

  useEffect(() => {
    async function validateAvailability() {
      if (!startDate || !startTime) return;
      try {
        const { checkNannyAvailabilityAction } = await import("@/lib/actions/booking-actions");
        const res = await checkNannyAvailabilityAction({
          nannyId: nanny.id,
          startDate,
          startTime,
          hiringMode,
          pulseGrid
        });
        setClashStatus(res);
      } catch (err) {
        console.error("Clash check failed", err);
      }
    }
    const timer = setTimeout(validateAvailability, 500);
    return () => clearTimeout(timer);
  }, [startDate, startTime, hiringMode, pulseGrid, nanny.id]);

  const handleContinue = async () => {
    if (totalChildren === 0) {
      showToast("Please select at least one child", "error");
      return;
    }

    if (hiringMode === "hourly" && totalHours === 0) {
       showToast("Please select your care hours", "error");
       return;
    }

    if (!phoneNumber || !emergencyName || !emergencyPhone || !bookingLocation) {
      showToast("Please complete the Safety & Location section", "error");
      return;
    }

    if (!locationDescription.trim()) {
       showToast("Detailed location/house description is required", "error");
       return;
    }

    setLoading(true);
    try {
      const res = await initBookingAction({
        caregiverId: nanny.id,
        startDate,
        startTime,
        endDate: hiringMode === "retainer" ? format(addDays(new Date(startDate), 7), "yyyy-MM-dd") : startDate,
        hiringMode,
        refinedSchedule: hiringMode === "hourly" ? pulseGrid : { retainer: true, startTime },
        childCount: totalChildren,
        selectedChildIds,
        notes: noteToNanny,
        locationDescription,
        phoneNumber,
        emergencyContactName: emergencyName,
        emergencyContactPhone: emergencyPhone,
      });
      router.push(`/nannies/${nanny.id}/book/payment?bookingId=${res.bookingId}`);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Left Content */}
      <div className="lg:col-span-8 space-y-12">
        
        {/* Profile Identity Header */}
        <div className="flex items-center gap-6">
           <div className="relative shrink-0">
             <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-2xl shadow-primary/10">
               <img 
                 src={nanny.profileImage} 
                 alt={nanny.name}
                 className="w-full h-full object-cover" 
               />
             </div>
             {nanny.isVerified && (
               <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                 <MaterialIcon name="verified" className="text-xs block" fill />
               </div>
             )}
           </div>
           <div>
              <h1 className="text-4xl font-headline font-black italic text-primary tracking-tighter leading-none mb-2">Booking {nanny.name}.</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-3">
                 <span>Kindred {nanny.isVerified ? 'Gold' : 'Standard'} Certified</span>
                 <span className="w-1 h-1 bg-slate-300 rounded-full" />
                 <span>{nanny.experienceYears}+ Years Experience</span>
              </p>
           </div>
        </div>

        {/* Step 1: Care Model */}
        <section className="space-y-6">
          <header>
             <h2 className="text-xl font-bold font-headline text-primary mb-1 italic">1. Select Your Care Model</h2>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => setHiringMode("hourly")}
              className={cn(
                "relative text-left p-8 rounded-[2rem] border-2 transition-all group overflow-hidden",
                hiringMode === "hourly" 
                  ? "bg-white border-primary shadow-2xl shadow-primary/5 ring-4 ring-primary/5" 
                  : "bg-surface-container-lowest border-outline-variant/10 hover:border-primary/30"
              )}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={cn(
                  "p-4 rounded-2xl transition-colors",
                  hiringMode === "hourly" ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                )}>
                  <MaterialIcon name="schedule" className="text-2xl" fill={hiringMode === "hourly"} />
                </div>
                <div className={cn(
                   "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all leading-none",
                   hiringMode === "hourly" ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                )}>
                   {hiringMode === "hourly" ? 'SELECTED' : 'HOURLY'}
                </div>
              </div>
              <h3 className="text-2xl font-headline font-black italic tracking-tighter text-primary">Hourly Care</h3>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed font-medium">Flexible support for occasional needs, date nights, or emergency shifts.</p>
              <div className="mt-8 flex items-baseline gap-1">
                <span className="text-4xl font-headline font-black italic text-primary">
                  ${isInstant ? calculateInstantRate(nanny.hourlyRate) : nanny.hourlyRate}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">/hr</span>
                {isInstant && (
                  <span className="text-[8px] font-black uppercase text-error ml-2 bg-error/10 px-2 py-0.5 rounded-full">+20% Instant Premium</span>
                )}
              </div>
            </button>

            <button 
              onClick={() => setHiringMode("retainer")}
              className={cn(
                "relative text-left p-8 rounded-[2rem] border-2 transition-all group overflow-hidden",
                hiringMode === "retainer" 
                  ? "bg-white border-primary shadow-2xl shadow-primary/5 ring-4 ring-primary/5" 
                  : "bg-surface-container-lowest border-outline-variant/10 hover:border-primary/30"
              )}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={cn(
                  "p-4 rounded-2xl transition-colors",
                  hiringMode === "retainer" ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                )}>
                  <MaterialIcon name="calendar_month" className="text-2xl" fill={hiringMode === "retainer"} />
                </div>
                <div className={cn(
                   "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full transition-all leading-none",
                   hiringMode === "retainer" ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                )}>
                  {hiringMode === "retainer" ? 'SELECTED' : 'WEEKLY'}
                </div>
              </div>
              <h3 className="text-2xl font-headline font-black italic tracking-tighter text-primary">Weekly Retainer</h3>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed font-medium">Consistent premium care with guaranteed availability for full-time needs.</p>
              <div className="mt-8 flex items-baseline gap-1">
                <span className="text-4xl font-headline font-black italic text-primary">
                  ${isInstant ? calculateInstantRate(nanny.weeklyRate) : nanny.weeklyRate}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">/wk</span>
                {isInstant && (
                  <span className="text-[8px] font-black uppercase text-error ml-2 bg-error/10 px-2 py-0.5 rounded-full">+20% Instant Premium</span>
                )}
              </div>
            </button>
          </div>
        </section>

        {/* Dynamic Coordination Context */}
        <section className="bg-white p-10 rounded-[3.5rem] border-2 border-primary/5 shadow-2xl shadow-primary/5 space-y-10">
           <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                 <h3 className="text-2xl font-headline font-black italic text-primary tracking-tight">
                    {hiringMode === "hourly" ? (isDetailed ? "Detailed Interval Selection" : "Quick Selection") : "Weekly Schedule"}
                 </h3>
                 <p className="text-xs text-slate-400 font-medium italic">
                    {hiringMode === "hourly" 
                      ? (isDetailed ? "Select precise 4-hour intervals for absolute flexibility." : "Rapidly select care hours by day and shift type.")
                      : `Set the start date and time when ${nanny.name.split(' ')[0]} should begin their first shift.`}
                 </p>
              </div>
              {hiringMode === "hourly" && (
                 <button 
                  onClick={isDetailed ? switchToSimple : switchToDetailed}
                  className="flex items-center gap-2 bg-slate-50 hover:bg-primary/5 px-4 py-2 rounded-xl border border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-primary transition-all active:scale-95"
                 >
                    <MaterialIcon name={isDetailed ? "auto_awesome_motion" : "grid_view"} className="text-sm" />
                    {isDetailed ? "Back to Quick Selection" : "Switch to precise hours"}
                 </button>
              )}
           </header>

           {clashStatus?.hasClash && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-error/10 border border-error/20 p-6 rounded-3xl flex items-center gap-4 text-error"
             >
                <div className="bg-error text-white p-2 rounded-xl">
                  <MaterialIcon name="warning" fill />
                </div>
                <div>
                   <p className="text-xs font-black uppercase tracking-widest">Schedule Conflict Detected</p>
                   <p className="text-[11px] font-medium opacity-80">
                     {nanny.name.split(' ')[0]} appears to have another booking during this time. You can still proceed, but the caregiver may reject the booking if the conflict is absolute.
                   </p>
                </div>
             </motion.div>
           )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-primary/5">
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Engagement Start Date</label>
                 <input 
                   type="date"
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-5 px-6 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                 />
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Arrival Time (Expected)</label>
                 <input 
                   type="time"
                   value={startTime}
                   onChange={(e) => setStartTime(e.target.value)}
                   className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-5 px-6 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                 />
              </div>
           </div>

           {hiringMode === "hourly" ? (
             <>
               {!isDetailed ? (
                  // SIMPLE MODE: Quick Setup
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {DAYS.map((day, idx) => {
                        const isDaySelected = pulseGrid[`${idx}_2`] && pulseGrid[`${idx}_3`];
                        const isNightSelected = pulseGrid[`${idx}_4`] && pulseGrid[`${idx}_5`];
                        return (
                           <div key={day} className={cn(
                              "p-6 rounded-[2rem] border-2 transition-all",
                              (isDaySelected || isNightSelected) ? "bg-primary/5 border-primary/20" : "bg-slate-50/50 border-outline-variant/5"
                           )}>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center">{day}</p>
                              <div className="space-y-3">
                                 <button 
                                    onClick={() => toggleSimpleShift(idx, "day")}
                                    className={cn(
                                       "w-full py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                       isDaySelected ? "bg-white text-primary shadow-xl shadow-primary/10 border-2 border-primary" : "bg-white/40 text-slate-400 border-2 border-transparent"
                                    )}
                                 >
                                    <MaterialIcon name="wb_sunny" className="text-sm" fill={isDaySelected} />
                                    Day Shift
                                 </button>
                                 <button 
                                    onClick={() => toggleSimpleShift(idx, "night")}
                                    className={cn(
                                       "w-full py-4 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                                       isNightSelected ? "bg-white text-primary shadow-xl shadow-primary/10 border-2 border-primary" : "bg-white/40 text-slate-400 border-2 border-transparent"
                                    )}
                                 >
                                    <MaterialIcon name="nights_stay" className="text-sm" fill={isNightSelected} />
                                    Night Shift
                                 </button>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               ) : (
                  // DETAILED MODE: Pulse Grid
                  <div className="space-y-8 overflow-x-auto pb-4 custom-scrollbar">
                      <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-4 min-w-[800px]">
                        <div />
                        {DAYS.map((day) => (
                            <div key={day} className="flex flex-col items-center">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day}</span>
                            </div>
                        ))}

                        {INTERVALS.map((interval) => (
                            <>
                              <div key={interval.id} className="flex flex-col justify-center items-end pr-4 border-r border-outline-variant/10">
                                <span className="text-[9px] font-black text-slate-900 leading-none">{interval.name}</span>
                                <span className="text-[8px] font-medium text-slate-400 mt-1">{interval.label}</span>
                              </div>
                              {DAYS.map((_, dayIdx) => {
                                const key = `${dayIdx}_${interval.id}`;
                                const isSelected = pulseGrid[key];
                                return (
                                  <button
                                      key={key}
                                      onClick={() => togglePulseChunk(dayIdx, interval.id)}
                                      className={cn(
                                        "h-14 rounded-2xl border-2 transition-all group relative flex items-center justify-center overflow-hidden",
                                        isSelected 
                                          ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-[1.03] z-10" 
                                          : "bg-slate-50 border-outline-variant/10 hover:border-primary/40 hover:bg-white"
                                      )}
                                  >
                                      <MaterialIcon 
                                        name={interval.icon} 
                                        className={cn(
                                            "text-lg transition-transform",
                                            isSelected ? "text-white scale-125" : "text-slate-300 group-hover:scale-110"
                                        )} 
                                        fill={isSelected}
                                      />
                                  </button>
                                );
                              })}
                            </>
                        ))}
                      </div>
                  </div>
               )}
             </>
           ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Retainer Start Date</label>
                   <input 
                     type="date"
                     value={startDate}
                     onChange={(e) => setStartDate(e.target.value)}
                     className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-5 px-6 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                   />
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Time the caregiver should arrive</label>
                   <input 
                     type="time"
                     value={startTime}
                     onChange={(e) => setStartTime(e.target.value)}
                     className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-5 px-6 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                   />
                </div>
              </div>
           )}
        </section>

        {/* Safety & Location Block */}
        <section className="bg-white p-10 rounded-[3.5rem] border-2 border-primary/10 space-y-10 shadow-xl shadow-primary/5">
            <header className="flex items-center gap-5">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary flex items-center justify-center">
                    <MaterialIcon name="security" fill />
                </div>
                <div>
                    <h3 className="text-xl font-headline font-black italic text-primary tracking-tight">Location & Contact Verification</h3>
                    <p className="text-xs text-slate-400 font-medium">Detailed house info and mapping coordinates.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-8">
                <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Where should the nanny come over?</label>
                    <div className="relative">
                      <MapboxAutocomplete 
                        initialLocation={bookingLocation}
                        onSelect={(loc) => setBookingLocation(loc)}
                        placeholder="Search by Zip Code, City, or Area..."
                        inputClassName="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-4 px-12 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                      />
                      <MaterialIcon name="location_on" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary z-10" fill />
                    </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Detailed description of the place and house <span className="text-red-500">*</span></label>
                      <span className="text-[9px] font-bold text-primary/60 uppercase tracking-tighter">Required for caregiver routing</span>
                   </div>
                   <textarea 
                     value={locationDescription}
                     onChange={(e) => setLocationDescription(e.target.value)}
                     placeholder="Example: Blue house with white fence, second door on the left. Feel free to paste a Google Maps link here for perfect accuracy..."
                     rows={4}
                     className="w-full bg-slate-50 border border-outline-variant/10 rounded-[2rem] py-6 px-8 text-sm font-medium focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300"
                   />
                   <div className="flex items-center gap-3 p-4 bg-secondary/5 rounded-2xl border border-secondary/10">
                      <MaterialIcon name="map" className="text-secondary text-lg" fill />
                      <p className="text-[10px] font-bold text-secondary/70 leading-relaxed uppercase tracking-widest">
                         Pro Tip: Copy a link from Google Maps and paste it above to help your caregiver arrive exactly on time.
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-outline-variant/10 pt-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Your Mobile Number</label>
                        <input 
                        type="tel"
                        value={phoneNumber}
                        placeholder="+1 (555) 000-0000"
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-4 px-6 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Emergency Name</label>
                        <input 
                        type="text"
                        value={emergencyName}
                        placeholder="e.g. Spouse/Neighbor"
                        onChange={(e) => setEmergencyName(e.target.value)}
                        className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-4 px-6 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Emergency Phone</label>
                        <input 
                        type="tel"
                        value={emergencyPhone}
                        placeholder="Phone Number"
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-4 px-6 font-bold text-sm focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* Child Picker */}
        <section className="bg-surface-container-low p-10 rounded-[3.5rem] space-y-12">
          <div className="space-y-6">
             <header className="flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black text-primary uppercase tracking-widest">Who is {nanny.name.split(" ")[0]} caring for?</h3>
                   <p className="text-[11px] text-slate-400 font-medium">Select children below.</p>
                </div>
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-2xl border border-outline-variant/10">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Kids</span>
                   <span className="text-lg font-headline font-black text-primary">{totalChildren}</span>
                </div>
             </header>

             <div className="flex flex-wrap gap-4">
                {childrenList.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleChildToggle(child.id)}
                    className={cn(
                      "flex items-center gap-4 p-2 pr-6 rounded-full border-2 transition-all",
                      selectedChildIds.includes(child.id)
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105"
                        : "bg-white border-outline-variant/5 text-slate-600 hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm",
                      selectedChildIds.includes(child.id) ? "bg-white/20" : "bg-slate-100"
                    )}>
                      {child.name[0]}
                    </div>
                    <div className="text-left">
                       <p className="text-[11px] font-black uppercase tracking-tighter">{child.name}</p>
                       <p className="text-[9px] font-medium opacity-60">Age {child.age}</p>
                    </div>
                    {selectedChildIds.includes(child.id) && (
                       <MaterialIcon name="check_circle" className="text-white ml-2 text-sm" fill />
                    )}
                  </button>
                ))}

                <button 
                  onClick={() => setManualChildCount(manualChildCount + 1)}
                  className="flex items-center gap-4 bg-white p-2 pr-6 rounded-full border-2 border-dashed border-outline-variant/20 hover:border-primary/30 transition-colors"
                >
                   <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
                      <MaterialIcon name="add" className="text-slate-400" />
                   </div>
                   <div className="text-left">
                      <p className="text-[11px] font-black uppercase tracking-tighter">Guest Child</p>
                      <p className="text-[9px] font-medium text-primary">Add manual (+) </p>
                   </div>
                </button>
                {manualChildCount > 0 && (
                  <button 
                    onClick={() => setManualChildCount(0)}
                    className="p-3 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-red-500 transition-colors"
                  >
                    Clear Guests ({manualChildCount})
                  </button>
                )}
             </div>
          </div>

          <div className="space-y-4">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Note to {nanny.name.split(" ")[0]}</label>
             <textarea 
               value={noteToNanny}
               onChange={(e) => setNoteToNanny(e.target.value)}
               placeholder="Introduce your family, specific needs, or any allergies..."
               rows={4}
               className="w-full bg-white border border-outline-variant/10 rounded-[2.5rem] py-6 px-8 text-sm font-medium focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-300 shadow-sm"
             />
          </div>
        </section>

      </div>

      {/* Right Sidebar: Summary */}
      <aside className="lg:col-span-4">
        <div className="lg:sticky lg:top-32 space-y-6">
          <div className="bg-white rounded-[3rem] shadow-2xl shadow-primary/5 p-10 border border-outline-variant/5">
             <h3 className="text-2xl font-headline font-black italic tracking-tighter text-primary mb-8 underline decoration-secondary/30">Booking Summary</h3>
             
             <div className="space-y-6">
                <div className="space-y-3">
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>Care Service {hiringMode === 'hourly' ? `(${totalHours} hrs)` : '(Weekly)'} {isInstant && "(20% Premium)"}</span>
                      <span className="text-primary">${subtotal.toFixed(2)}</span>
                   </div>
                   {totalChildren > 1 && (
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-secondary">
                        <span>Additional Child (x{totalChildren - 1})</span>
                        <span>+${extraChildPremium.toFixed(2)}</span>
                      </div>
                   )}
                   {isInstant && (
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-error">
                        <span>Instant Care Premium (20%)</span>
                        <span>Applied</span>
                      </div>
                   )}
                   <div className="h-px bg-slate-100 my-4" />
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                      <span>Stripe Processing (2.9%)</span>
                      <span className="text-primary">${stripeFee.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                      <span>Kindred Service Fee (4.6%)</span>
                      <span className="text-primary">${kindredFee.toFixed(2)}</span>
                   </div>
                </div>

                <div className="pt-8 border-t border-slate-100 flex justify-between items-end">
                   <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Your Investment</p>
                      <h4 className="text-5xl font-headline font-black italic tracking-tighter text-primary">${total.toFixed(0)}</h4>
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase mb-2">USD</span>
                </div>

                <div className="bg-surface-container-low p-6 rounded-3xl space-y-4">
                   <div className="flex gap-4">
                      <MaterialIcon name="verified_user" className="text-secondary" fill />
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary">Escrow Protected</p>
                         <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1">
                            Funds held securely. Payment released only when care is confirmed.
                         </p>
                      </div>
                   </div>
                </div>

                <button 
                  onClick={handleContinue}
                  disabled={loading || totalChildren === 0}
                  className="w-full bg-primary text-white py-6 rounded-2xl font-headline font-bold text-xl hover:bg-secondary hover:shadow-2xl hover:shadow-secondary/20 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-30 disabled:translate-y-0 shadow-xl shadow-primary/20 flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Confirm & Secure
                      <MaterialIcon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
             </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
