"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  user: any;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", href: "/dashboard/admin" },
  { id: "caregivers", label: "Caregivers", icon: "groups", href: "/dashboard/admin/caregivers" },
  { id: "bookings", label: "Bookings", icon: "calendar_month", href: "/dashboard/admin/bookings" },
  { id: "analytics", label: "Analytics", icon: "analytics", href: "/dashboard/admin/analytics" },
  { id: "revenue", label: "Revenue", icon: "payments", href: "/dashboard/admin/revenue" },
  { id: "financial-ops", label: "Financial Ops", icon: "account_balance_wallet", href: "/dashboard/admin/financial-ops" },
  { id: "liquidity", label: "Liquidity", icon: "magic_button", href: "/dashboard/admin/liquidity" },
  { id: "settings", label: "Settings", icon: "settings", href: "/dashboard/admin/settings" },
];

export default function AdminDashboardLayoutClient({ children, user }: LayoutProps) {
  const pathname = usePathname();

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen antialiased flex">
      {/* SideNavBar */}
      <aside className="h-screen w-64 fixed left-0 top-0 flex flex-col bg-slate-50 border-r border-slate-200/50 p-4 gap-y-4 font-headline text-sm tracking-tight z-50">
        <div className="mb-8 px-4 py-6">
          <h1 className="text-xl font-black text-[#1D3557] tracking-tighter leading-none italic">Kindred Admin</h1>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Admin Area</p>
        </div>

        <nav className="flex flex-col h-full gap-y-1">
          {NAV_ITEMS.filter(item => item.id !== 'liquidity' || user.role === 'admin').map((item) => {
            const isActive = pathname === item.href || (item.id !== 'dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group active:translate-x-1",
                  isActive
                    ? "bg-white text-[#1D3557] font-bold shadow-sm border border-slate-200/50"
                    : "text-slate-600 hover:text-[#1D3557] hover:bg-[#1D3557]/5"
                )}
              >
                <MaterialIcon 
                  name={item.icon} 
                  className={cn("text-[20px]", isActive ? "text-[#1D3557]" : "text-slate-400 group-hover:text-[#1D3557]")} 
                  fill={isActive}
                />
                <span className="uppercase tracking-wider text-[11px] font-bold">{item.label}</span>
              </Link>
            );
          })}

          <div className="mt-auto pt-4 border-t border-slate-200/50 space-y-1">
            <button className="w-full bg-[#1D3557] text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-[#1D3557]/10 hover:opacity-90 transition-all flex items-center justify-center gap-2 active:scale-95 mb-4">
              <MaterialIcon name="summarize" className="text-sm" />
              Generate Report
            </button>
            <Link 
              href="/dashboard/admin/support"
              className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-[#1D3557] hover:bg-[#1D3557]/5 rounded-lg transition-all duration-200"
            >
              <MaterialIcon name="contact_support" className="text-[20px] text-slate-400" />
              <span className="font-semibold">Support</span>
            </Link>
            <Link 
              href="/login"
              className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-error hover:bg-error/5 rounded-lg transition-all duration-200"
            >
              <MaterialIcon name="logout" className="text-[20px] text-slate-400" />
              <span className="font-semibold">Logout</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 min-h-screen relative">
        {/* Top App Bar (Glass) */}
        <header className="fixed top-0 right-0 left-64 z-40 bg-white/80 backdrop-blur-xl flex items-center justify-between px-8 py-3 h-16 shadow-sm shadow-[#1D3557]/5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-[#1D3557] uppercase tracking-[0.2em] italic leading-none">
              Admin Overview
            </span>
            <div className="h-4 w-px bg-slate-200 mx-2"></div>
            <div className="relative group">
              <MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-[#1D3557] transition-colors" />
              <input 
                type="text" 
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 bg-slate-100/50 border-none rounded-full text-xs w-64 focus:ring-2 focus:ring-[#1D3557]/20 transition-all outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-slate-100 pr-6">
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors relative group">
                <MaterialIcon name="notifications" className="text-xl group-hover:scale-110 transition-transform" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors group">
                <MaterialIcon name="help_outline" className="text-xl group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-[#1D3557] leading-none">{user.fullName}</p>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mt-1">Administrator</p>
              </div>
              <img 
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`} 
                alt="Admin" 
                className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm ring-2 ring-[#1D3557]/5"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="pt-24 pb-12 px-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}
