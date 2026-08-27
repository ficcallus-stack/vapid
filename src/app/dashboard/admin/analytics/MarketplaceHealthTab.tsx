"use client";

import { MaterialIcon } from "@/components/MaterialIcon";

export default function MarketplaceHealthTab({ data }: { data: any }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <span className="text-secondary font-bold text-xs tracking-widest uppercase mb-2 block">Executive Insights</span>
          <h2 className="text-4xl font-extrabold text-primary tracking-tight leading-none mb-2 font-headline">Marketplace Health</h2>
          <p className="text-on-surface-variant max-w-xl">Deep-dive into the supply-demand dynamics and performance cohorts.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <MaterialIcon name="visibility" className="text-primary" />
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Total Visitors</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{data.totalVisitors?.toLocaleString() || 0}</h3>
        </div>

        <div className="col-span-12 lg:col-span-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-secondary-fixed rounded-lg flex items-center justify-center">
              <MaterialIcon name="timer" className="text-on-secondary-fixed" />
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Avg. Time-to-Hire</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{data.timeToHire} Days</h3>
        </div>

        <div className="col-span-12 lg:col-span-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-lg flex items-center justify-center">
              <MaterialIcon name="group_add" className="text-on-tertiary-fixed" />
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Application Density</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{data.appDensity.toFixed(1)} <span className="text-sm font-normal text-slate-400">per job</span></h3>
        </div>

        <div className="col-span-12 lg:col-span-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-primary-fixed rounded-lg flex items-center justify-center">
              <MaterialIcon name="task_alt" className="text-on-primary-fixed" />
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Job Fulfillment Rate</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{data.fulfillmentRate.toFixed(1)}%</h3>
        </div>

        <div className="col-span-12 lg:col-span-3 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/5">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 bg-secondary-fixed-dim rounded-lg flex items-center justify-center">
              <MaterialIcon name="repeat" className="text-on-secondary-fixed" />
            </div>
          </div>
          <p className="text-on-surface-variant text-sm font-medium">Retention Rate</p>
          <h3 className="text-3xl font-bold text-primary mt-1">{data.retentionRate}%</h3>
        </div>

        {/* Map */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <h3 className="text-xl font-bold text-primary font-headline">Supply/Demand Ratio by State</h3>
              <p className="text-sm text-on-surface-variant">Real-time heatmapping of active caregiver availability vs job posts.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
            <div className="space-y-6">
              {data.supplyDemand.map((sd: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{sd.state}</span>
                    <span className="text-on-surface-variant">{sd.ratio} ({sd.status})</span>
                  </div>
                  <div className="h-3 bg-surface-container-low rounded-full overflow-hidden">
                    <div className={`h-full ${sd.color} rounded-full`} style={{ width: `${sd.fillPercent}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-100 rounded-xl flex items-center justify-center p-8">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Geo Map Render</span>
            </div>
          </div>
        </div>

        {/* Visitor Traffic & Referrers */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/5">
          <h3 className="text-xl font-bold text-primary mb-6 font-headline">Top Referrers</h3>
          <div className="space-y-4">
            {data.referrers?.length > 0 ? data.referrers.map((ref: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-surface rounded-xl">
                <p className="text-sm font-bold text-primary truncate mr-4">{ref.source}</p>
                <div className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">{ref.count} Visits</div>
              </div>
            )) : <p className="text-sm text-slate-500 italic">No referrer data available.</p>}
          </div>
        </div>

        {/* Visitor Locations */}
        <div className="col-span-12 lg:col-span-6 bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/5">
          <h3 className="text-xl font-bold text-primary mb-6 font-headline">Visitor Locations</h3>
          <div className="space-y-4">
            {data.locations?.length > 0 ? data.locations.map((loc: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-surface rounded-xl">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="place" className="text-secondary/50 text-sm" />
                  <p className="text-sm font-bold text-primary truncate">{loc.location}</p>
                </div>
                <div className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-bold rounded-full">{loc.count} Users</div>
              </div>
            )) : <p className="text-sm text-slate-500 italic">No location data available.</p>}
          </div>
        </div>

        {/* Regions */}
        <div className="col-span-12 lg:col-span-12 bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/5">
          <h3 className="text-xl font-bold text-primary mb-6 font-headline">Top Yielding Regions (Actual Revenue)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {data.yieldRegions?.map((yr: any, idx: number) => (
              <div key={idx} className="flex items-center p-5 bg-surface rounded-xl shadow-sm border border-outline-variant/10">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex justify-center items-center mr-4">
                  <span className="text-lg font-bold text-primary/50">{idx + 1}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary mb-1">{yr.region}</p>
                  <p className="text-[10px] text-tertiary-container font-bold">+{yr.growth}% Growth</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-primary">${(yr.volume/100).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
