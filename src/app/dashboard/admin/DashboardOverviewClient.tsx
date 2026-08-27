"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";

interface DashboardOverviewClientProps {
  summary: {
    totalCommunity: number;
    nannies: number;
    families: number;
    revenueTotal: number;
    escrowTotal: number;
    pendingReviews: number;
  };
  activity: any[];
}

export default function DashboardOverviewClient({ summary, activity }: DashboardOverviewClientProps) {
  const { showToast } = useToast();
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const handleBroadcastSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
        title: formData.get("title"),
        message: formData.get("message"),
        targetRole: formData.get("targetRole"),
        priority: formData.get("priority") === "high" ? "high" : "normal"
    };

    setIsBroadcasting(true);
    try {
        const res = await fetch("/api/notifications/broadcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        if (res.ok) {
            showToast("Notification Sent Successfully!", "success");
            setIsBroadcastModalOpen(false);
        } else {
            showToast("Failed to send notification.", "error");
        }
    } catch (err) {
        showToast("Error sending notification.", "error");
    } finally {
        setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Total Users */}
        <div className="col-span-1 md:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all duration-500">
          <div className="relative z-10 flex flex-col h-full">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Total Users</p>
            <h3 className="text-5xl font-black text-[#031f41] tracking-tighter italic">{summary.totalCommunity.toLocaleString()}</h3>
            <div className="mt-auto pt-6 flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 shadow-sm">
                <MaterialIcon name="trending_up" className="text-sm" /> 
                GROWTH
              </div>
            </div>
          </div>
          <MaterialIcon name="groups" className="absolute -right-4 -bottom-4 text-9xl text-slate-50 opacity-50 font-thin transition-transform group-hover:scale-110 duration-700" />
        </div>

        {/* Nannies */}
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed mb-6 shadow-inner ring-4 ring-white">
            <MaterialIcon name="child_care" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Nannies</p>
          <h4 className="text-3xl font-black text-[#031f41] mt-2 italic">{summary.nannies.toLocaleString()}</h4>
        </div>

        {/* Families */}
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-500">
          <div className="w-12 h-12 rounded-2xl bg-secondary-fixed flex items-center justify-center text-on-secondary-fixed mb-6 shadow-inner ring-4 ring-white">
            <MaterialIcon name="family_restroom" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic leading-none">Families</p>
          <h4 className="text-3xl font-black text-[#031f41] mt-2 italic">{summary.families.toLocaleString()}</h4>
        </div>

        {/* Pending Operations */}
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-2xl shadow-primary/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-slate-900 opacity-80"></div>
          <div className="relative z-10">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 italic">Pending Actions</p>
            <h4 className="text-3xl font-black tracking-tighter italic">{summary.pendingReviews}</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Pending Review</p>
          </div>
          <div className="relative z-10 pt-4 mt-auto">
             <button className="text-[9px] font-black text-white bg-white/20 px-3 py-1.5 rounded-full hover:bg-white/30 transition-all uppercase tracking-widest italic border border-white/10">
                Needs Attention
             </button>
          </div>
          <MaterialIcon name="priority_high" className="absolute -right-2 -top-2 text-6xl text-white/5 font-thin" />
        </div>
      </div>
      
      {/* Admin Toolbox */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          onClick={() => setIsBroadcastModalOpen(true)}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
        >
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <MaterialIcon name="campaign" className="text-3xl" />
          </div>
          <div>
             <h4 className="text-lg font-black text-primary italic leading-tight">Send Notification</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Send a message to all users</p>
          </div>
          <MaterialIcon name="chevron_right" className="ml-auto text-slate-300" />
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 cursor-not-allowed opacity-50">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <MaterialIcon name="analytics" className="text-3xl" />
          </div>
          <div>
             <h4 className="text-lg font-black text-primary italic leading-tight">Data & Analytics</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Detailed user statistics</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 cursor-not-allowed opacity-50">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <MaterialIcon name="security" className="text-3xl" />
          </div>
          <div>
             <h4 className="text-lg font-black text-primary italic leading-tight">Security Logs</h4>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">System security records</p>
          </div>
        </div>
      </div>

      {/* Broadcast Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-500">
              <button 
                onClick={() => setIsBroadcastModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"
              >
                <MaterialIcon name="close" />
              </button>

              <div className="mb-8">
                 <h2 className="text-2xl font-headline font-black text-primary italic tracking-tight">Send Notification 📢</h2>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Send a message to users immediately</p>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Send To</label>
                    <select 
                      name="targetRole"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 ring-primary/10 transition-all outline-none"
                    >
                      <option value="all">Everyone (Parents & Nannies)</option>
                      <option value="parent">Parents Only</option>
                      <option value="caregiver">Nannies Only</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message Title</label>
                    <input 
                      name="title"
                      required
                      placeholder="e.g., Scheduled Maintenance"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 ring-primary/10 transition-all outline-none"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Message Body</label>
                    <textarea 
                      name="message"
                      required
                      rows={3}
                      placeholder="Details of the announcement..."
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-primary focus:ring-2 ring-primary/10 transition-all outline-none resize-none"
                    />
                 </div>

                 <div className="flex items-center gap-2">
                    <input type="checkbox" name="priority" id="priority" value="high" className="w-4 h-4 rounded text-primary" />
                    <label htmlFor="priority" className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic cursor-pointer">Mark as High Priority (Send Email)</label>
                 </div>

                 <button 
                   type="submit"
                   disabled={isBroadcasting}
                   className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                 >
                   {isBroadcasting ? "Sending..." : "Send Message"} <MaterialIcon name="bolt" className="ml-2" />
                 </button>
              </form>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Market Graph Area */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h4 className="text-xl font-black text-[#031f41] mb-1 italic tracking-tight">Financial Activity</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Activity over the last 30 days</p>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button className="px-5 py-1.5 bg-white shadow-sm rounded-lg text-[10px] font-black text-[#031f41] uppercase tracking-widest transition-all">Volume</button>
              <button className="px-5 py-1.5 text-[10px] font-black text-slate-400 hover:text-primary uppercase tracking-widest transition-all">Escrow</button>
            </div>
          </div>
          
          <div className="flex-1 min-h-[250px] relative flex items-end gap-2 group">
             {/* Simulated Abstract Area bars */}
             {[40, 65, 45, 80, 55, 95, 75, 50, 85, 90, 60, 100].map((h, i) => (
                <div key={i} className="flex-1 relative flex flex-col justify-end">
                   <div 
                      className="w-full bg-slate-50 group-hover:bg-primary/5 rounded-t-sm transition-all duration-700" 
                      style={{ height: `${h}%` }}
                   >
                     <div 
                        className="w-full bg-primary/20 hover:bg-primary transition-all duration-300 rounded-t-sm" 
                        style={{ height: `${h * 0.7}%` }} 
                     />
                   </div>
                   {i % 4 === 0 && (
                      <span className="absolute -bottom-6 left-0 text-[9px] font-black text-slate-300 uppercase tracking-widest">W{Math.floor(i/4)+1}</span>
                   )}
                </div>
             ))}
          </div>
        </div>

        {/* Marketplace Activity Timeline */}
        <div className="lg:col-span-4 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col shadow-inner">
           <h4 className="text-sm font-black text-primary uppercase tracking-widest italic mb-8 flex items-center justify-between">
              Recent Activity
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           </h4>
           <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
             {activity.map((act, i) => (
                <div key={i} className="relative flex gap-5 pl-8 group cursor-default">
                   <span className={cn(
                      "absolute left-0 top-1 w-6 h-6 rounded-lg flex items-center justify-center ring-4 ring-slate-50 transition-all group-hover:scale-110",
                      act.color,
                      "text-white shadow-lg"
                   )}>
                      <MaterialIcon name={act.icon} className="text-[12px]" />
                   </span>
                   <div>
                      <p className="text-[10px] font-black text-primary uppercase tracking-tight leading-none italic">{act.title}</p>
                      <p className="text-[10px] text-slate-500 mt-2 font-bold leading-relaxed uppercase tracking-widest italic">{act.description}</p>
                      <p className="text-[9px] text-slate-400 mt-1.5 uppercase font-black tracking-widest italic opacity-50">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                   </div>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}
