"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SafetyOpsTab from "./SafetyOpsTab";
import FinancialIntelTab from "./FinancialIntelTab";
import MarketplaceHealthTab from "./MarketplaceHealthTab";
import MarketplaceGeoMap from "@/components/admin/MarketplaceGeoMap";
import { MaterialIcon } from "@/components/MaterialIcon";
import { getMarketplaceHealthData } from "./actions";

type Tab = "financial" | "marketplace" | "safety";

export default function AnalyticsClient({ 
  safetyData, 
  financialData, 
  marketplaceData: initialMarketplaceData
}: { 
  safetyData: any, 
  financialData: any, 
  marketplaceData: any 
}) {
  const [activeTab, setActiveTab] = useState<Tab>("safety");
  const [marketplaceData, setMarketplaceData] = useState(initialMarketplaceData);
  const [timeFilter, setTimeFilter] = useState<"1h" | "24h" | "7d" | "30d" | "all">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    async function refreshData() {
      setIsRefreshing(true);
      try {
        const newData = await getMarketplaceHealthData(timeFilter);
        setMarketplaceData(newData);
      } catch (err) {
        console.error("Failed to fetch fresh marketplace data", err);
      } finally {
        setIsRefreshing(false);
      }
    }
    refreshData();
  }, [timeFilter]);

  return (
    <div className="bg-surface min-h-screen text-on-surface">
      {/* Main Canvas - Expanded Panoramic Layout */}
      <main className="w-full min-h-screen transition-all duration-500">
        <header className="w-full sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm flex flex-col">
          {/* Top Header */}
          <div className="flex items-center justify-between px-8 py-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <MaterialIcon name="analytics" className="text-primary" fill />
              </div>
              <div>
                <h2 className="text-xl font-bold text-primary tracking-tight font-headline">Executive Dashboard</h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Platform-Wide Intelligence</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="relative hidden lg:block">
                <MaterialIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input 
                  className="pl-12 pr-6 py-2.5 bg-slate-50 border-0 rounded-full text-xs w-72 focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                  placeholder="Query advanced metrics..." 
                  type="text"
                />
              </div>
              <div className="h-8 w-[1px] bg-outline-variant/20" />
              <button className="bg-primary text-white text-[10px] font-black px-5 py-2.5 rounded-full uppercase tracking-tighter hover:shadow-lg transition-all active:scale-95">
                Export Intel
              </button>
            </div>
          </div>

          {/* Panoramic Sub-Navigation Tab Bar */}
          <div className="px-8 pb-3 -mt-1">
            <nav className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab("safety")}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all text-[11px] uppercase tracking-wider font-black ${
                  activeTab === 'safety' 
                  ? 'bg-white text-primary shadow-[0_2px_10px_rgba(0,0,0,0.05)] scale-100' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-primary scale-95 opacity-70'
                }`}
              >
                <MaterialIcon name="shield" className="text-sm" fill={activeTab === 'safety'} /> Safety & Ops
              </button>
              
              <button 
                onClick={() => setActiveTab("financial")}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all text-[11px] uppercase tracking-wider font-black ${
                  activeTab === 'financial' 
                  ? 'bg-white text-primary shadow-[0_2px_10_rgba(0,0,0,0.05)] scale-100' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-primary scale-95 opacity-70'
                }`}
              >
                <MaterialIcon name="payments" className="text-sm" fill={activeTab === 'financial'} /> Financial Intel
              </button>

              <button 
                onClick={() => setActiveTab("marketplace")}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl transition-all text-[11px] uppercase tracking-wider font-black ${
                  activeTab === 'marketplace' 
                  ? 'bg-white text-primary shadow-[0_2px_10_rgba(0,0,0,0.05)] scale-100' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-primary scale-95 opacity-70'
                }`}
              >
                <MaterialIcon name="storefront" className="text-sm" fill={activeTab === 'marketplace'} /> Marketplace
              </button>
            </nav>
          </div>
        </header>

        {/* Panoramic Content Engine */}
        <div className="p-10 max-w-[1800px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-full">
            {activeTab === "safety" && <SafetyOpsTab data={safetyData} />}
            {activeTab === "financial" && <FinancialIntelTab data={financialData} />}
            {activeTab === "marketplace" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="flex justify-end items-center gap-4 mb-4">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Time Range:</span>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="bg-white border border-outline-variant/20 rounded-xl px-4 py-2 text-sm font-bold text-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                    disabled={isRefreshing}
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Today</option>
                    <option value="7d">This Week</option>
                    <option value="30d">Last Month</option>
                    <option value="all">All Time</option>
                  </select>
                  {isRefreshing && <span className="text-primary text-xs animate-pulse font-bold">Refreshing...</span>}
                </div>
                <MarketplaceGeoMap />
                <MarketplaceHealthTab data={marketplaceData} />
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
