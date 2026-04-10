"use client";

import { MaterialIcon } from "./MaterialIcon";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const INTERVALS = [
  { id: 0, label: "00-04", name: "Midnight", icon: "bedtime" },
  { id: 1, label: "04-08", name: "Early AM", icon: "wb_twilight" },
  { id: 2, label: "08-12", name: "Morning", icon: "wb_sunny" },
  { id: 3, label: "12-16", name: "Afternoon", icon: "sunny" },
  { id: 4, label: "16-20", name: "Evening", icon: "wb_cloudy" },
  { id: 5, label: "20-00", name: "Night", icon: "nights_stay" },
];

interface JobScheduleGridProps {
    schedule: Record<string, boolean>;
}

export default function JobScheduleGrid({ schedule }: JobScheduleGridProps) {
    return (
        <div className="bg-white/50 backdrop-blur-sm rounded-[2.5rem] p-8 border border-outline-variant/10 shadow-sm overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <MaterialIcon name="calendar_view_week" fill />
                </div>
                <div>
                    <h4 className="font-headline font-black text-xl italic text-primary leading-none">Requested Timeline</h4>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-1">Precise Engagement Window</p>
                </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
                <div className="min-w-[600px] space-y-6">
                    {/* Days Header */}
                    <div className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 px-2">
                        <div />
                        {DAYS.map(day => (
                            <div key={day} className="text-center">
                                <span className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-[0.2em] italic">{day}</span>
                            </div>
                        ))}
                    </div>

                    {/* Intervals */}
                    <div className="space-y-2">
                        {INTERVALS.map(interval => (
                            <div key={interval.id} className="grid grid-cols-[100px_repeat(7,1fr)] gap-2 items-center">
                                <div className="flex flex-col justify-center items-end pr-4">
                                    <span className="text-[9px] font-black text-primary leading-none mb-0.5 italic">{interval.name}</span>
                                    <span className="text-[7px] font-bold text-on-surface-variant/40 uppercase tracking-tighter">{interval.label}</span>
                                </div>
                                {DAYS.map((_, dayIdx) => {
                                    const key = `${dayIdx}_${interval.id}`;
                                    const isSelected = schedule?.[key];
                                    return (
                                        <div
                                            key={key}
                                            className={cn(
                                                "h-12 rounded-xl border transition-all flex items-center justify-center",
                                                isSelected 
                                                    ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-100" 
                                                    : "bg-surface-container-low border-transparent text-on-surface-variant/5 scale-95 opacity-50"
                                            )}
                                        >
                                            <MaterialIcon name={interval.icon} className="text-sm" fill={isSelected} />
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 pt-6 border-t border-outline-variant/10 flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60">Active Session</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-surface-container-low rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30">Off-Duty</span>
                </div>
            </div>
        </div>
    );
}
