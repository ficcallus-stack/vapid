"use client";

import { useState, useEffect } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: any) => void;
    initialFilters: any;
}

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const [jobType, setJobType] = useState(initialFilters.jobType || "all");
    const [minRate, setMinRate] = useState(initialFilters.minRate || 25);
    const [radius, setRadius] = useState(initialFilters.radius || 25);
    const [useLocation, setUseLocation] = useState(!!initialFilters.latitude);
    const [isLocating, setIsLocating] = useState(false);

    // Sync state when opened
    useEffect(() => {
        if (isOpen) {
            setJobType(initialFilters.jobType || "all");
            setMinRate(initialFilters.minRate || 25);
            setRadius(initialFilters.radius || 25);
            setUseLocation(!!initialFilters.latitude);
        }
    }, [isOpen, initialFilters]);

    if (!isOpen) return null;

    const handleApply = () => {
        if (useLocation) {
            setIsLocating(true);
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    onApply({
                        jobType,
                        minRate,
                        radius,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                    setIsLocating(false);
                    onClose();
                },
                (err) => {
                    console.error("Location error:", err);
                    onApply({ jobType, minRate, latitude: null, longitude: null }); 
                    setIsLocating(false);
                    onClose();
                }
            );
        } else {
            onApply({ jobType, minRate, latitude: null, longitude: null, radius: null });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end bg-primary/20 backdrop-blur-md animate-in fade-in duration-500">
            <div 
                className="bg-white w-full max-w-xl h-full shadow-[-32px_0_64px_-16px_rgba(3,31,65,0.15)] overflow-y-auto animate-in slide-in-from-right duration-500 flex flex-col"
            >
                {/* Visual Header Strip */}
                <div className="h-2 bg-gradient-to-r from-primary via-secondary to-primary-container"></div>

                {/* Header */}
                <div className="p-12 pb-8 flex justify-between items-start">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/5 rounded-full">
                            <span className="w-1 h-1 bg-primary rounded-full"></span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Advanced Engine</span>
                        </div>
                        <h3 className="font-headline text-5xl font-black text-primary italic tracking-tighter leading-none">
                            Refine Your <br/> <span className="text-secondary text-4xl">Search.</span>
                        </h3>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-14 h-14 rounded-full bg-slate-50 hover:bg-primary hover:text-white transition-all duration-300 flex items-center justify-center text-primary/40 shadow-sm border border-outline-variant/10 group"
                    >
                        <MaterialIcon name="close" className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="px-12 py-8 space-y-12 flex-grow">
                    {/* Job Types Grid */}
                    <div className="space-y-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 flex items-center gap-2">
                            <MaterialIcon name="category" className="text-sm" />
                            Placement Categories
                        </label>
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'all', label: 'All Opportunities', desc: 'Browse the entire marketplace' },
                                { id: 'recurring', label: 'Recurring Roles', desc: 'Steady, long-term family placements' },
                                { id: 'one_time', label: 'One-time Roles', desc: 'Short-term and urgent bookings' }
                            ].map((type) => (
                                <button
                                    key={type.id}
                                    onClick={() => setJobType(type.id)}
                                    className={cn(
                                        "p-6 rounded-3xl text-left transition-all duration-300 border flex justify-between items-center group",
                                        jobType === type.id 
                                            ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 translate-x-1" 
                                            : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/10 hover:border-primary/20 hover:bg-slate-50"
                                    )}
                                >
                                    <div>
                                        <div className="text-xs font-black uppercase tracking-widest mb-1 group-hover:italic transition-all">{type.label}</div>
                                        <div className={cn("text-[10px] opacity-60 font-medium", jobType === type.id && "text-white/60")}>{type.desc}</div>
                                    </div>
                                    {jobType === type.id && <MaterialIcon name="check_circle" className="text-white" fill />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Financial Threshold */}
                    <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-outline-variant/10">
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/30 flex items-center gap-2">
                                <MaterialIcon name="payments" className="text-sm" />
                                Optimal Rate
                            </label>
                            <span className="text-3xl font-black text-primary italic tracking-tighter">${minRate}/hr</span>
                        </div>
                        <input 
                            type="range" 
                            min="20" 
                            max="100" 
                            step="5"
                            value={minRate}
                            onChange={(e) => setMinRate(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-primary/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between text-[9px] font-black text-on-surface-variant/20 tracking-[0.3em] uppercase italic">
                            <span>Entry Level</span>
                            <span>Executive Care</span>
                        </div>
                    </div>

                    {/* Proximity / Location Focus */}
                    <div className="p-8 rounded-[2.5rem] border-2 border-primary/5 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                                    useLocation ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-slate-100 text-on-surface-variant/20"
                                )}>
                                    <MaterialIcon name="my_location" />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-xs font-black text-primary uppercase tracking-tight">Proximity Intel</div>
                                    <div className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">Target local families</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setUseLocation(!useLocation)}
                                className={cn(
                                    "w-14 h-8 rounded-full transition-all duration-500 relative p-1",
                                    useLocation ? "bg-primary" : "bg-slate-200"
                                )}
                            >
                                <div className={cn(
                                    "w-6 h-6 bg-white rounded-full transition-all duration-500 shadow-sm",
                                    useLocation ? "translate-x-6" : "translate-x-0"
                                )}></div>
                            </button>
                        </div>

                        {useLocation && (
                            <div className="pt-8 border-t border-outline-variant/10 animate-in slide-in-from-top-4 duration-500">
                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30 italic">Search Radius</span>
                                    <span className="px-4 py-1.5 bg-secondary/10 text-secondary rounded-full text-[10px] font-black uppercase tracking-widest">{radius} Miles</span>
                                </div>
                                <div className="flex gap-2">
                                    {[10, 25, 50, 100].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setRadius(r)}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest",
                                                radius === r ? "bg-primary text-white border-primary shadow-xl shadow-primary/10" : "bg-transparent text-on-surface-variant/30 border-outline-variant/10 hover:border-primary/20"
                                            )}
                                        >
                                            {r}mi
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-12 bg-white border-t border-outline-variant/10 grid grid-cols-2 gap-4">
                    <button 
                        onClick={onClose}
                        className="py-6 bg-slate-50 text-on-surface-variant rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all active:scale-95"
                    >
                        Keep Current
                    </button>
                    <button 
                        onClick={handleApply}
                        disabled={isLocating}
                        className="py-6 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] shadow-[0_24px_48px_-12px_rgba(3,31,65,0.25)] hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                    >
                        {isLocating ? (
                            <>
                                <MaterialIcon name="sync" className="animate-spin text-sm" />
                                Synchronizing...
                            </>
                        ) : (
                            <>
                                Finalize Settings
                                <MaterialIcon name="check_circle" className="text-sm group-hover:scale-110 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
