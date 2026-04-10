"use client";

import { useState, useEffect, useCallback } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { getOpenJobs, FilterOptions } from "./actions";
import FilterModal from "./FilterModal";

interface JobBoardProps {
    initialJobs: any[];
}

export default function JobBoard({ initialJobs }: JobBoardProps) {
    const [jobs, setJobs] = useState(initialJobs);
    const [filters, setFilters] = useState<FilterOptions>({
        jobType: "all",
        minRate: 20,
        limit: 10,
        offset: 0
    });
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialJobs.length === 10);
    const [isLocating, setIsLocating] = useState(false);

    const fetchJobs = useCallback(async (newFilters: FilterOptions, append = false) => {
        setIsLoading(true);
        try {
            const results = await getOpenJobs(newFilters);
            if (append) {
                setJobs(prev => [...prev, ...results]);
            } else {
                setJobs(results);
            }
            setHasMore(results.length === 10);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleApplyFilters = (newFilters: any) => {
        const updatedFilters = { ...filters, ...newFilters, offset: 0 };
        setFilters(updatedFilters);
        fetchJobs(updatedFilters);
    };

    const handleLoadMore = () => {
        const nextOffset = filters.offset! + 10;
        const updatedFilters = { ...filters, offset: nextOffset };
        setFilters(updatedFilters);
        fetchJobs(updatedFilters, true);
    };

    const handleQuickLocation = () => {
        if (filters.latitude) {
            // Toggle off
            handleApplyFilters({ latitude: null, longitude: null, radius: null });
            return;
        }

        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                handleApplyFilters({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    radius: 25
                });
                setIsLocating(false);
            },
            (err) => {
                console.error("Location error:", err);
                setIsLocating(false);
            }
        );
    };

    return (
        <div className="space-y-16">
            <style dangerouslySetInnerHTML={{ __html: `
                .glass-bar {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                .asymmetric-clip {
                    border-radius: 2.5rem 1rem 2.5rem 1rem;
                }
                .filter-pill {
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            `}} />

            {/* Premium Horizontal Filter Bar */}
            <div className="sticky top-6 z-40 px-2 lg:px-0">
                <div className="glass-bar p-3 md:p-4 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(3,31,65,0.08)] flex flex-wrap items-center gap-4 border border-outline-variant/10">
                    
                    {/* Job Type Dropdown */}
                    <div className="flex flex-col gap-1 px-6 border-r border-outline-variant/10 group min-w-[140px]">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Category</label>
                        <select 
                            value={filters.jobType}
                            onChange={(e) => handleApplyFilters({ jobType: e.target.value })}
                            className="bg-transparent border-none p-0 text-sm font-black text-primary uppercase italic focus:ring-0 cursor-pointer hover:text-secondary mb-1"
                        >
                            <option value="all">Every Role</option>
                            <option value="recurring">Recurring</option>
                            <option value="one_time">One-time</option>
                        </select>
                    </div>

                    {/* Rate Threshold */}
                    <div className="flex flex-col gap-1 px-6 border-r border-outline-variant/10 group min-w-[140px]">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40">Min Rate</label>
                        <select 
                            value={filters.minRate}
                            onChange={(e) => handleApplyFilters({ minRate: parseInt(e.target.value) })}
                            className="bg-transparent border-none p-0 text-sm font-black text-primary uppercase italic focus:ring-0 cursor-pointer hover:text-secondary mb-1"
                        >
                            <option value="20">$20/hr+</option>
                            <option value="30">$30/hr+</option>
                            <option value="40">$40/hr+</option>
                            <option value="50">$50/hr+</option>
                        </select>
                    </div>

                    {/* Location Quick Toggle */}
                    <div className="flex items-center gap-3 px-6 h-12 bg-surface-container-low/50 rounded-2xl border border-outline-variant/5">
                        <button 
                            onClick={handleQuickLocation}
                            disabled={isLocating}
                            className={cn(
                                "flex items-center gap-2 text-xs font-black uppercase tracking-wider transition-all filter-pill",
                                filters.latitude ? "text-secondary" : "text-primary/40 hover:text-primary"
                            )}
                        >
                            <MaterialIcon 
                                name={isLocating ? "sync" : "near_me"} 
                                className={cn("text-lg", isLocating && "animate-spin")} 
                                fill={!!filters.latitude}
                            />
                            {isLocating ? "Locating..." : filters.latitude ? "Radius Active" : "Near Me"}
                        </button>
                    </div>

                    <div className="ml-auto flex gap-3">
                        <button 
                            onClick={handleLoadMore}
                            disabled={isLoading}
                            className="w-12 h-12 flex items-center justify-center text-primary/40 hover:text-primary hover:bg-white rounded-full transition-all border border-outline-variant/10 shadow-sm"
                        >
                            <MaterialIcon name="refresh" className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <button 
                            onClick={() => setIsFilterModalOpen(true)}
                            className="bg-primary text-white pl-8 pr-12 h-12 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:shadow-2xl hover:shadow-primary/20 transition-all active:scale-95 shadow-xl shadow-primary/10 flex items-center gap-2 group relative overflow-hidden"
                        >
                            <span className="relative z-10">Advanced Filters</span>
                            <div className="absolute right-3 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-secondary transition-colors">
                                <MaterialIcon name="tune" className="text-sm" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Refined Job Grid */}
            {jobs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {jobs.map((job, idx) => {
                        const fallbacks = ["/family_illustration_1_1774602472962.png", "/family_illustration_2_1774602489023.png"];
                        const displayImg = job.parentPhoto || fallbacks[idx % 2];
                        const childCount = job.children?.length || 1;
                        
                        return (
                            <div key={job.id} className="group flex flex-col h-full animate-in fade-in slide-in-from-bottom-8 duration-700" style={{ animationDelay: `${idx * 100}ms` }}>
                                {/* Asymmetric Job Identity */}
                                <div className="relative h-72 mb-8 overflow-hidden asymmetric-clip shadow-2xl group-hover:-translate-y-2 transition-transform duration-700">
                                     <img 
                                        src={displayImg} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-90 group-hover:brightness-100" 
                                        alt="Family Profile" 
                                    />
                                    
                                    {/* High-Fidelity Overlay Info */}
                                    <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                                    <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.2em] font-label">Accepting Now</span>
                                                </div>
                                                <h3 className="font-headline text-3xl font-black text-white tracking-tighter italic">The {job.parentName}s</h3>
                                            </div>
                                            <div className="bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-2 rounded-2xl">
                                                 <div className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                                                    {job.scheduleType.replace('_', ' ')}
                                                 </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Curated Details Panel */}
                                <div className="px-4 flex-grow flex flex-col">
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-[0.2em] font-label">Investment</p>
                                            <p className="text-2xl font-black text-primary italic tracking-tight">
                                                {job.scheduleType === 'recurring' 
                                                    ? `$${(job.retainerBudget || 0) / 100}` 
                                                    : `$${job.minRate}`
                                                }
                                                <span className="text-xs opacity-30">/{job.scheduleType === 'recurring' ? 'wk' : 'hr'}</span>
                                            </p>
                                        </div>
                                        <div className="space-y-2 text-right">
                                            <p className="text-[10px] font-black text-on-surface-variant/30 uppercase tracking-[0.2em] font-label">Location</p>
                                            <p className="text-xs font-black text-primary uppercase tracking-widest truncate">{job.location?.split(',')[0] || "Private Cluster"}</p>
                                        </div>
                                    </div>

                                    {/* Traits Row */}
                                    <div className="flex flex-wrap gap-2 mb-10">
                                        <div className="bg-[#f0f4f8] text-primary/60 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/5">
                                            <MaterialIcon name="child_care" className="text-sm" />
                                            {childCount} {childCount > 1 ? 'Children' : 'Infant'}
                                        </div>
                                        <div className="bg-[#f0f4f8] text-primary/60 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-primary/5">
                                            <MaterialIcon name="verified_user" className="text-sm" fill />
                                            Verified
                                        </div>
                                    </div>

                                    <div className="mt-auto">
                                        <Link 
                                            href={`/dashboard/nanny/open-roles/${job.id}`}
                                            className="w-full h-16 bg-white border-2 border-primary text-primary rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-primary hover:text-white transition-all duration-500 group/btn"
                                        >
                                            Review Placement
                                            <MaterialIcon name="chevron_right" className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                 <div className="py-40 bg-white rounded-[4rem] border border-dashed border-outline-variant/30 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-surface-container-low rounded-3xl flex items-center justify-center text-primary/10 shadow-inner">
                        <MaterialIcon name="inventory_2" size={48} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-headline text-4xl font-black text-primary tracking-tighter italic leading-none">Quiet in the Marketplace</h3>
                        <p className="text-on-surface-variant max-w-sm mx-auto leading-relaxed font-medium italic opacity-60">
                            Try expanding your search radius or lowering the rate minimum to see more prestigious opportunities.
                        </p>
                    </div>
                    <button 
                        onClick={() => handleApplyFilters({ jobType: 'all', minRate: 20, latitude: null })}
                        className="px-12 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Reset All Filters
                    </button>
                </div>
            )}

            {hasMore && (
                <div className="mt-24 pt-12 border-t border-outline-variant/10 flex flex-col items-center gap-6">
                    <button 
                        onClick={handleLoadMore}
                        disabled={isLoading}
                        className="group flex items-center gap-4 bg-primary text-white pl-12 pr-6 py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all"
                    >
                        {isLoading ? <MaterialIcon name="sync" className="animate-spin" /> : "Load More Opportunities"}
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-500">
                             <MaterialIcon name="add" />
                        </div>
                    </button>
                    <p className="text-on-surface-variant/30 text-[10px] font-black uppercase tracking-[0.4em] italic">Precision Curated</p>
                </div>
            )}

            <FilterModal 
                isOpen={isFilterModalOpen} 
                onClose={() => setIsFilterModalOpen(false)}
                onApply={handleApplyFilters}
                initialFilters={filters}
            />
        </div>
    );
}
