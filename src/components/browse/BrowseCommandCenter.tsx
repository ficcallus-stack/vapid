"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface BrowseCommandCenterProps {
  initialLocation?: string;
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

export default function BrowseCommandCenter({ 
  initialLocation = "", 
  currentPage, 
  totalPages, 
  totalResults 
}: BrowseCommandCenterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Search Analytics Tracker
  const trackSearch = async (loc: string, filters: object = {}) => {
    try {
      await fetch('/api/analytics/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryText: loc, filtersApplied: { ...filters, source: 'browse_command_center' } })
      });
    } catch { /* Silent */ }
  };

  // Mode Switcher (Local vs Nationwide)
  const isLocalOn = searchParams.get("mode") === "local";
  const [mode, setMode] = useState<"nationwide" | "local">(isLocalOn ? "local" : "nationwide");

  // Filter States
  const [distance, setDistance] = useState(searchParams.get("distance") || "30");
  const [rateType, setRateType] = useState<"hourly" | "weekly">((searchParams.get("rateType") as any) || "hourly");
  const [maxRate, setMaxRate] = useState(parseInt(searchParams.get("rate") || (rateType === "weekly" ? "4000" : "100")));
  const [globalOnly, setGlobalOnly] = useState(searchParams.get("global") === "true");
  const [availableNow, setAvailableNow] = useState(searchParams.get("available") === "true");
  const [alwaysFree, setAlwaysFree] = useState(searchParams.get("always") === "true");
  const [locationName, setLocationName] = useState(searchParams.get("location") || initialLocation || "Nationwide");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Popover States
  const [showRate, setShowRate] = useState(false);

  const locationRef = useRef<HTMLDivElement>(null);
  const rateRef = useRef<HTMLDivElement>(null);

  // 1. Geolocation Flow (Parent Profile -> Browser -> IP Fallback)
  useEffect(() => {
    if (initialLocation && !searchParams.get("lat")) {
      setLocationName(initialLocation);
      return;
    }

    if (!searchParams.get("lat") && !searchParams.get("lng") && mode === "local") {
      // Auto-locate if no URL params and mode is local
      handleLocateMe();
    }
  }, [initialLocation]);

  const handleLocateMe = async () => {
    setIsSearching(true);
    
    // Step 1: Browser Geolocation (Highest Accuracy)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          finalizeLocation(latitude, longitude, "Current Location");
        },
        async (error) => {
          console.warn("Geolocation denied/failed, starting IP fallback chain...", error.message);
          await runIpFallbackChain();
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      await runIpFallbackChain();
    }
  };

  const runIpFallbackChain = async () => {
    try {
      // Provider 1: ip-api.com
      const res = await fetch("http://ip-api.com/json/"); // Note: some browsers block http-to-https, but good for local/dev
      const data = await res.json();
      if (data.status === 'success') {
        finalizeLocation(data.lat, data.lon, `${data.city}, ${data.region}`);
        return;
      }
      throw new Error("ip-api failed");
    } catch (e) {
      try {
        // Provider 2: ipapi.co
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        if (data.latitude && data.longitude) {
          finalizeLocation(data.latitude, data.longitude, `${data.city}, ${data.region_code}`);
          return;
        }
      } catch (e2) {
        console.error("All location providers failed. Defaulting to Nationwide.");
        setLocationName("Nationwide");
        setIsSearching(false);
      }
    }
  };

  const finalizeLocation = (lat: number, lng: number, name: string) => {
    updateFilters({ 
      lat: lat.toString(), 
      lng: lng.toString(), 
      location: name,
      mode: "local" 
    });
    setLocationName(name);
    setIsSearching(false);
  };

  // 2. Mapbox Geocoding Logic
  useEffect(() => {
    if (searchQuery.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${token}&autocomplete=true&countries=us`);
        const data = await res.json();
        setSuggestions(data.features || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Mapbox Geocoding error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Sync state with URL params
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || (key === "rate" && value === "100" && rateType === "hourly") || (key === "rate" && value === "4000" && rateType === "weekly")) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    // Reset to page 1 on filter change
    if (!updates.page) params.set("page", "1");
    
    router.push(`/browse?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (rateRef.current && !rateRef.current.contains(event.target as Node)) setShowRate(false);
      setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Nuclear Reset: Clear All Filters
  const handleClearAll = () => {
    setSearchQuery("");
    setLocationName("Nationwide");
    setMode("nationwide");
    setGlobalOnly(false);
    setAlwaysFree(false);
    setAvailableNow(false);
    setMaxRate(rateType === "weekly" ? 4000 : 100);
    
    // Push clean URL
    router.push('/browse', { scroll: false });
  };

  return (
    <div className="mb-16 space-y-4">
      {/* Tier 1: Context & Meta Utility */}
      <div className="flex items-center justify-between px-6 py-1">
        <div className="flex items-center gap-2 group">
          <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
            Discovery Context: <span className="text-primary group-hover:text-secondary transition-colors">{totalResults} Specialists in {locationName}</span>
          </span>
        </div>
        
        {(searchParams.toString() !== "" && searchParams.toString() !== "page=1") && (
          <button 
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#8c8e91] hover:text-primary transition-colors outline-none"
          >
            <MaterialIcon name="filter_list_off" className="text-[14px]" />
            Clear All Filters
          </button>
        )}
      </div>

      {/* Tier 2: The Command Deck (Search & Mode) */}
      <div className="sticky top-[88px] z-40 bg-white/80 backdrop-blur-[24px] p-2 rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(3,31,65,0.12),0_0_0_1px_rgba(3,31,65,0.02)] flex flex-col lg:flex-row items-center justify-between border border-white transition-all gap-2">
        
        {/* Left: Mode Toggle */}
        <div className="relative flex items-center bg-[#f4f3f3] rounded-full p-1 shrink-0 w-[200px]">
          <motion.div 
            layoutId="mode-bg"
            className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-full shadow-[0_2px_8px_rgba(3,31,65,0.08)] z-0"
            initial={false}
            animate={{ x: mode === "local" ? "100%" : 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button 
            onClick={() => {
              setMode("nationwide");
              updateFilters({ mode: "nationwide", lat: null, lng: null, location: null });
              setLocationName("Nationwide");
            }}
            className={cn(
              "relative z-10 w-1/2 py-2.5 text-[10px] font-black uppercase tracking-tighter transition-colors flex items-center justify-center gap-1.5 outline-none",
              mode === "nationwide" ? "text-primary" : "text-primary/30 hover:text-primary"
            )}
          >
            <MaterialIcon name="public" className="text-[16px]" /> All US
          </button>
          <button 
            onClick={() => {
              setMode("local");
              handleLocateMe();
            }}
            className={cn(
              "relative z-10 w-1/2 py-2.5 text-[10px] font-black uppercase tracking-tighter transition-colors flex items-center justify-center gap-1.5 outline-none",
              mode === "local" ? "text-primary" : "text-primary/30 hover:text-primary"
            )}
          >
            <MaterialIcon name="near_me" className="text-[16px]" /> Near Me
          </button>
        </div>

        {/* Middle: Mapbox Engine */}
        <div className="relative flex-1 max-w-xl mx-auto w-full z-50">
          <div className="relative group">
            <MaterialIcon name="search" className={cn(
               "absolute left-5 top-1/2 -translate-y-1/2 transition-colors",
               isSearching ? "text-secondary animate-pulse" : "text-primary/20"
            )} />
            <input 
              type="text"
              value={searchQuery || (locationName === "Nationwide" ? "" : locationName)}
              onChange={(e) => {
                 setSearchQuery(e.target.value);
                 setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search Zip, City, or Name..."
              className="w-full bg-[#f4f3f3]/50 hover:bg-[#f4f3f3] focus:bg-white focus:ring-4 focus:ring-secondary/5 border-none rounded-2xl py-4 pl-14 pr-12 text-sm font-bold text-primary placeholder:text-primary/20 transition-all"
            />
            { (searchQuery || locationName !== "Nationwide") && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setLocationName("Nationwide");
                  updateFilters({ mode: "nationwide", lat: null, lng: null, location: null });
                  setMode("nationwide");
                }}
                className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center hover:bg-primary/10 transition-colors"
              >
                <MaterialIcon name="close" className="text-[14px] text-primary/40" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-3xl rounded-[2rem] p-4 shadow-[0_48px_96px_-12px_rgba(3,31,65,0.2)] border border-primary/5 shadow-2xl"
              >
                <p className="text-[9px] font-black uppercase tracking-widest text-primary/20 mb-3 px-4">Instant Suggestions</p>
                <div className="grid grid-cols-1 gap-1">
                  {suggestions.map((place) => (
                    <button
                      key={place.id}
                      onClick={() => {
                        const [lng, lat] = place.center;
                        const name = place.text;
                        updateFilters({ lat: lat.toString(), lng: lng.toString(), location: name, mode: "local" });
                        setLocationName(name);
                        setSearchQuery("");
                        setShowSuggestions(false);
                        setMode("local");
                      }}
                      className="w-full text-left px-5 py-4 rounded-2xl hover:bg-secondary/5 flex items-center gap-4 transition-all group/item"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#f4f3f3] group-hover/item:bg-white flex items-center justify-center transition-colors">
                        <MaterialIcon name={place.place_type[0] === 'postcode' ? 'map' : 'location_city'} className="text-[18px] text-primary/30 group-hover/item:text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-primary">{place.text}</p>
                        <p className="text-[11px] text-primary/40 font-medium">{place.place_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Fine-Tuning Mini-Pills */}
        <div className="flex items-center gap-2 pr-2">
          {mode === "local" && (
            <div className="flex items-center bg-[#f4f3f3] rounded-full px-4 py-2.5 border border-primary/5">
              <MaterialIcon name="radar" className="text-[14px] text-secondary mr-2" />
              <select 
                value={distance}
                onChange={(e) => {
                  setDistance(e.target.value);
                  updateFilters({ distance: e.target.value });
                }}
                className="bg-transparent border-none p-0 pr-6 focus:ring-0 text-[11px] font-black uppercase text-primary appearance-none outline-none cursor-pointer"
                style={{ backgroundImage: `url("data:image/svg+xml;utf8,<svg fill='%23031f41' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right center', backgroundSize: '14px' }}
              >
                <option value="10">10mi</option>
                <option value="30">30mi</option>
                <option value="50">50mi</option>
                <option value="100">100mi</option>
              </select>
            </div>
          )}
          
          <div className="relative" ref={rateRef}>
            <button 
              onClick={() => setShowRate(!showRate)}
              className={cn(
                "flex items-center gap-2 px-5 py-3 rounded-full text-[11px] font-black uppercase transition-all duration-300 ",
                (rateType === "hourly" ? maxRate < 100 : maxRate < 4000) ? "bg-primary text-white" : "bg-[#f4f3f3] text-primary hover:bg-[#e9e8e8]"
              )}
            >
              <MaterialIcon name="payments" className="text-[16px]" /> 
              <span>{rateType === "weekly" ?`$${maxRate}/wk` : (maxRate === 100 ? "Budget" : `$${maxRate}/hr`)}</span>
              <MaterialIcon name="expand_more" className="text-[14px]" />
            </button>
            <AnimatePresence>
              {showRate && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 12 }}
                  className="absolute top-full mt-4 right-0 w-[280px] bg-white/95 backdrop-blur-3xl rounded-[2rem] p-7 z-50 shadow-[0_48px_96px_-12px_rgba(3,31,65,0.2)] border border-primary/5"
                >
                  <div className="flex bg-[#f4f3f3] rounded-2xl p-1.5 mb-8">
                    <button 
                      onClick={() => { setRateType("hourly"); setMaxRate(100); updateFilters({ rateType: "hourly", rate: "100" }); }}
                      className={cn("w-1/2 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", rateType === "hourly" ? "bg-white text-primary shadow-sm" : "text-primary/30")}
                    >Hourly</button>
                    <button 
                      onClick={() => { setRateType("weekly"); setMaxRate(4000); updateFilters({ rateType: "weekly", rate: "4000" }); }}
                      className={cn("w-1/2 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all", rateType === "weekly" ? "bg-white text-primary shadow-sm" : "text-primary/30")}
                    >Weekly</button>
                  </div>
                  <div className="flex flex-col mb-8">
                    <span className="text-[11px] font-black text-primary/30 uppercase tracking-[0.2em] mb-2">Maximum Budget</span>
                    <span className="text-4xl font-headline font-black text-primary">${maxRate}{((rateType === "hourly" && maxRate === 100) || (rateType === "weekly" && maxRate === 4000)) && "+"}</span>
                  </div>
                  <input 
                    type="range" min={rateType === "weekly" ? 300 : 25} max={rateType === "weekly" ? 4000 : 100} step={rateType === "weekly" ? 100 : 1}
                    value={maxRate} onChange={(e) => setMaxRate(parseInt(e.target.value))}
                    onMouseUp={() => updateFilters({ rate: maxRate.toString() })}
                    className="w-full h-1.5 bg-[#f4f3f3] rounded-lg appearance-none cursor-pointer accent-secondary" 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Tier 3: Secondary Filters & Pagination Paging */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button 
            onClick={() => { const next = !globalOnly; setGlobalOnly(next); updateFilters({ global: next ? "true" : null }); }}
            className={cn(
              "shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all",
              globalOnly ? "bg-primary text-white" : "bg-white text-primary border border-primary/5 hover:bg-[#f4f3f3]"
            )}
          >
            <MaterialIcon name="workspace_premium" className="text-[17px]" /> 
            Global Care
          </button>

          <button 
            onClick={() => { const next = !alwaysFree; setAlwaysFree(next); updateFilters({ always: next ? "true" : null }); }}
            className={cn(
              "shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all",
              alwaysFree ? "bg-secondary text-white" : "bg-white text-primary border border-primary/5 hover:bg-[#f4f3f3]"
            )}
          >
            <MaterialIcon name="calendar_today" className="text-[17px]" /> 
            Full-Time Ready
          </button>

          <button 
            onClick={() => { const next = !availableNow; setAvailableNow(next); updateFilters({ available: next ? "true" : null }); }}
            className={cn(
              "shrink-0 flex items-center gap-2.5 px-6 py-3 rounded-full text-[11px] font-black uppercase transition-all",
              availableNow ? "bg-error text-white" : "bg-white text-primary border border-primary/5 hover:bg-[#f4f3f3]"
            )}
          >
            <div className={cn("w-1.5 h-1.5 rounded-full", availableNow ? "bg-white animate-ping" : "bg-error")} />
            {"Ready < 4h"}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-primary/5">
          <button 
            disabled={currentPage === 1}
            onClick={() => updateFilters({ page: (currentPage - 1).toString() })}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f4f3f3] disabled:opacity-20 transition-all"
          >
            <MaterialIcon name="chevron_left" className="text-[20px]" />
          </button>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary/30 px-2">{currentPage} / {totalPages || 1}</span>
          <button 
            disabled={currentPage >= totalPages}
            onClick={() => updateFilters({ page: (currentPage + 1).toString() })}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f4f3f3] disabled:opacity-20 transition-all"
          >
            <MaterialIcon name="chevron_right" className="text-[20px]" />
          </button>
        </div>
      </div>
    </div>
  );
}
