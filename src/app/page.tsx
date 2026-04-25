"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import Link from "next/link";
import HeroSearch from "@/components/HeroSearch";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function Home() {
  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <main className="pt-24 overflow-x-hidden">
        {/* Hero Section: Editorial Style */}
        <section className="relative px-6 py-16 md:py-24 max-w-7xl mx-auto min-h-[80vh] flex items-center">
          <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
            <div className="z-10 order-2 lg:order-1 space-y-10">
              <h1 className="text-6xl md:text-8xl font-extrabold font-headline text-primary tracking-tighter leading-[0.95] mb-6 drop-shadow-sm">
                Bespoke Care for Your <br/><span className="text-secondary italic underline decoration-secondary/20 underline-offset-8 decoration-8">Little Ones.</span>
              </h1>
              <p className="text-xl md:text-2xl text-on-surface-variant font-medium leading-relaxed max-w-xl opacity-80">
                Connecting elite families with the nation's most trusted, certified caregivers through an editorial-first experience.
              </p>
              
              <div className="space-y-8 pt-4">
                {/* Search Integration */}
                <div className="space-y-6">
                  <div className="relative group max-w-2xl">
                      <div className="absolute -inset-4 bg-primary/5 rounded-[2.5rem] blur-2xl group-hover:bg-primary/10 transition-all duration-700"></div>
                      <HeroSearch />
                  </div>
                  
                  {/* CTA Strips from design */}
                  <div className="flex items-center gap-6 px-4">
                    <Link href="/browse" className="flex items-center gap-2 group">
                      <span className="text-sm font-black text-primary uppercase tracking-widest group-hover:text-secondary transition-colors">Browse All Nannies</span>
                      <MaterialIcon name="arrow_forward" className="text-sm text-primary group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <div className="w-px h-4 bg-outline-variant/30"></div>
                    <Link href="/signup?role=caregiver" className="text-sm font-black text-secondary uppercase tracking-widest hover:brightness-90 transition-all">
                      Become a Nanny
                    </Link>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 items-center pt-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <img 
                        key={i}
                        className="w-12 h-12 rounded-full border-4 border-surface shadow-lg" 
                        alt="Portrait" 
                        src={`https://lh3.googleusercontent.com/aida-public/AB6AXuAi3E1QI4ecpCL3aNXasSH2ijIEVDEqF0pjPZUUia55DVrwp0NP1Rc0IqhDaV_hQhOVzk8Sc5e_4O6WEgm_9du_TEPvrb-EzOGgBr616AV9BfzJ3sae4BYcrMmSsH5vD2Ao1DLZXPgNzgpP_0jMRsv8_hCcUGkjgLsyMzJFdWExSKhtXKFCgTHcX4ZBBT5kA12VYacwPPzc2vbKqOZjqQiTHnslZgotIuivvtgmrIXA75CbQIl1RrdX5WqG_Y9ksu2npsk-SWl7N5c`} 
                      />
                    ))}
                  </div>
                  <p className="text-sm text-on-surface-variant font-black uppercase tracking-widest opacity-60">
                    Trusted by <span className="text-primary italic">10,000+ Premium Families</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="relative aspect-square md:aspect-auto md:h-[700px] w-full group">
                {/* Editorial Offset Backing */}
                <div className="absolute inset-0 bg-primary-container rounded-[4rem] rotate-3 translate-x-6 translate-y-6 opacity-5 group-hover:rotate-0 transition-transform duration-1000"></div>
                
                <img 
                  className="absolute inset-0 w-full h-full object-cover rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] z-10" 
                  alt="Premium Caregiver" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUa-64n74yIF-_q_gCLMp0Pdn-ziUbJX_MmIL1fPMaCyxBJqG9xnYh2_w4SSpImnZp94OE0rYrEcx5u_OnTSHB_pBTs8d6NjBUGQz3OGFIKPaUTXaFIYvehHfhMnOxzHFq8j35NGOpcISJSYJ2QlRAeugrLzo8EEzduwJv68bDSkRoIneTJgFZovs0R3GsXbTl7Ug12GpmMf0q6LwqinSDlPgwKROajo64zY5gKmwIAfbfrmpeRQK-hXgC0catHTxeWLxe2e1C_M8" 
                />

                {/* Floating Asymmetric Elements */}
                <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[2.5rem] shadow-2xl z-20 max-w-[280px] hidden md:block border border-slate-50 translate-x-4">
                  <div className="flex items-center gap-5 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-inner scale-110">
                      <MaterialIcon name="verified_user" fill />
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-black tracking-[0.2em] leading-none mb-1 opacity-40">Security First</p>
                      <p className="text-xl font-black text-primary font-headline italic leading-none">100% Verified</p>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium leading-relaxed italic opacity-70">
                    Every Kindred professional undergoes rigorous FBI-level background screening.
                  </p>
                </div>

                <div className="absolute top-20 -right-12 bg-white/95 backdrop-blur-xl p-6 rounded-[2rem] shadow-2xl z-20 flex items-center gap-4 hidden md:flex border border-white/20 hover:scale-105 transition-transform duration-500">
                    <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_15px_rgba(142,78,20,0.5)] animate-pulse"></div>
                    <span className="text-sm font-black text-primary uppercase tracking-[0.15em] italic">New Placement in Austin, TX</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Updated Trust Bar markers from screenshot */}
        <section className="bg-surface-container-low py-12 border-y border-slate-100/50">
          <div className="max-w-7xl mx-auto px-8">
             <div className="flex flex-wrap items-center justify-around gap-8 text-on-surface-variant/60 font-black text-[10px] uppercase tracking-[0.25em]">
                <div className="flex items-center gap-3">
                  <MaterialIcon name="groups" className="text-lg opacity-40" fill />
                  <span>10k+ Families</span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="verified_user" className="text-lg opacity-40" fill />
                  <span>100% Vetted Identity</span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="enhanced_encryption" className="text-lg opacity-40" fill />
                  <span>Stripe Secure Payments</span>
                </div>
                <div className="flex items-center gap-3">
                  <MaterialIcon name="workspace_premium" className="text-lg opacity-40" fill />
                  <span>Caregiver Excellence</span>
                </div>
             </div>
          </div>
        </section>

        {/* Global Caregiver Standards Exam Section */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="bg-surface-container-lowest rounded-[3rem] p-12 lg:p-20 shadow-2xl shadow-primary/5 border border-outline-variant/10 grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                  <MaterialIcon name="school" className="text-3xl" />
                </div>
                <h2 className="text-4xl md:text-5xl font-black font-headline text-primary tracking-tighter leading-none">
                  Global Caregiver <br/>Standards Exam
                </h2>
              </div>
              <p className="text-lg text-on-surface-variant font-medium leading-relaxed opacity-70">
                Elevate your career with the industry-standard certification. Our comprehensive exam verifies your expertise in child development, safety protocols, and professional ethics.
              </p>
              <ul className="space-y-4 pt-2">
                {[
                  "Unlock the 'Professional Badge' for your profile",
                  "Increase your hiring rate by up to 45%",
                  "Get featured in the 'Elite Caregivers' list"
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-4 text-on-surface font-bold text-sm">
                    <MaterialIcon name="check_circle" className="text-secondary text-xl" fill />
                    {text}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard/nanny/certifications" className="inline-flex items-center justify-center bg-primary text-white px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
                Take the Exam
              </Link>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-3xl opacity-50 group-hover:bg-primary/10 transition-all duration-1000"></div>
              <div className="relative bg-surface rounded-[2.5rem] p-4 shadow-2xl border border-outline-variant/10 rotate-2 group-hover:rotate-0 transition-transform duration-700">
                <div className="bg-primary/95 rounded-[2rem] overflow-hidden aspect-[16/10] relative">
                  <img 
                    className="w-full h-full object-cover opacity-30" 
                    alt="Certificate background" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYpG667RMTkJU8LnoHNmQegISxQuSHcNfgQ4F_dI8jVxVQI_0mePGZz19i9oLD3PZ6iTBH-mGh6lOK6clKMsMZ8QxtwH5QLc6c_El-EnwkPMCs1ia91-rEySh2bXjVMjpvqTYe-8foZ1B1DkZh9uENpxGny1DZuk9rITkhrgLhNihWnDZVmdTh5G6-62qAsde08FPJ8kol4-zkeux7QbScGIl8OXGOmf2N3GaiAKhE2-P5VWD6ZQEfB084rghk5a5d3EnOdyyWrpU"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center">
                       <MaterialIcon name="verified" className="text-4xl text-secondary" fill />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.4em]">Credential</p>
                      <p className="text-2xl font-black text-white font-headline tracking-tight italic">Kindred Elite Badge</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Experience Section (Redesign to Search|Connect|Hire) */}
        <section id="how-it-works" className="py-32 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-24 space-y-4">
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary">Simple Process</span>
            <h2 className="text-5xl md:text-7xl font-black font-headline text-primary tracking-tighter italic leading-none text-center">Find. Connect. Hire.</h2>
            <div className="w-16 h-2 bg-secondary mx-auto rounded-full shadow-lg"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-16">
            {[
              { title: "Search", desc: "Discover elite caregivers tailored to your family's unique schedule and requirements.", icon: "manage_search" },
              { title: "Connect", desc: "Interview top-tier talent through our secure platform and review verified certifications.", icon: "chat_bubble_outline" },
              { title: "Hire", desc: "Finalize arrangements with secure payments and comprehensive support for your peace of mind.", icon: "handshake" }
            ].map((item, idx) => (
              <div key={idx} className="group relative space-y-8 flex flex-col items-center text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-[1.5rem] bg-white shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-50 transition-all duration-700 group-hover:scale-110 group-hover:shadow-2xl">
                  <MaterialIcon name={item.icon} className="text-3xl text-primary" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-primary tracking-tight font-headline">{item.title}</h3>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed opacity-60 max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Referral Program Growth Section for Guests */}
        <section className="py-24 px-6 max-w-7xl mx-auto">
          <div className="bg-secondary rounded-[4rem] p-12 lg:p-24 relative overflow-hidden shadow-2xl shadow-secondary/20">
            {/* Visual Accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -ml-32 -mb-32 blur-2xl"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
              <div className="flex-1 space-y-8 text-center lg:text-left">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full border border-white/20 backdrop-blur-md">
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                   <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Ambassador Program</span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black font-headline text-white tracking-tighter leading-none italic">
                  Earn up to <br/><span className="underline decoration-white/20 underline-offset-8">$500 per Referral</span>
                </h2>
                <p className="text-white/80 text-xl font-medium leading-relaxed max-w-xl">
                  Help us build the nation's most trusted childcare network. Every verified connection you bring to Kindred earns you tier-based rewards.
                </p>
                <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-4">
                  <Link href="/referrals" className="bg-white text-secondary px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl hover:scale-105 transition-transform active:scale-95">
                    Learn How it Works
                  </Link>
                  <Link href="/signup" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-headline font-black text-lg hover:bg-white/20 transition-all">
                    Join Kindred
                  </Link>
                </div>
              </div>

              <div className="lg:w-1/3 w-full">
                <div className="bg-white/95 backdrop-blur-xl rounded-[3rem] p-10 shadow-2xl space-y-8 rotate-2 hover:rotate-0 transition-transform duration-700">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                        <MaterialIcon name="volunteer_activism" className="text-3xl" fill />
                      </div>
                      <div>
                        <p className="text-[10px] text-secondary font-black uppercase tracking-[0.2em] mb-1">Total Bounty</p>
                        <p className="text-3xl font-black text-primary font-headline italic">$500.00</p>
                      </div>
                   </div>
                   <div className="space-y-4 pt-2">
                     {[
                       { label: "Handshake", amount: "$25", icon: "how_to_reg" },
                       { label: "First Booking", amount: "$75", icon: "check_circle" },
                       { label: "Continuity", amount: "$150", icon: "stars" },
                       { label: "Headhunter", amount: "$250", icon: "verified" }
                     ].map((m, idx) => (
                       <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 italic">
                          <div className="flex items-center gap-3">
                             <MaterialIcon name={m.icon} className="text-secondary opacity-40" />
                             <span className="text-sm font-bold text-slate-600 tracking-tight">{m.label}</span>
                          </div>
                          <span className="font-black text-primary">{m.amount}</span>
                       </div>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Dual Path Paths Section: Redesign */}
        <section className="px-6 mb-32">
          <div className="max-w-7xl mx-auto bg-primary rounded-[4rem] p-12 lg:p-24 relative overflow-hidden shadow-[0_50px_120px_-30px_rgba(3,31,65,0.4)]">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
               <div className="space-y-10 text-center lg:text-left">
                  <h2 className="text-white text-5xl md:text-7xl font-black font-headline leading-[0.9] tracking-tighter italic">Ready to find <br/>your match?</h2>
                  <p className="text-primary-fixed-dim text-xl font-medium opacity-80 leading-relaxed max-w-md">
                    Whether you're looking for elite care or looking to share your professional passion, Kindred is your home.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
                     <Link href="/browse" className="bg-secondary text-on-secondary-fixed px-10 py-5 rounded-2xl font-headline font-black text-lg shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                        I need a Nanny
                        <MaterialIcon name="arrow_forward" />
                     </Link>
                     <Link href="/signup?role=caregiver" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-10 py-5 rounded-2xl font-headline font-black text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-3">
                        I am a Nanny
                        <MaterialIcon name="content_paste_go" />
                     </Link>
                  </div>
               </div>
               
               <div className="hidden lg:block relative">
                  <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] p-12 border border-white/10 space-y-8 rotate-3 scale-90 opacity-60">
                      <div className="space-y-4">
                         <div className="h-4 w-3/4 bg-white/20 rounded-full"></div>
                         <div className="h-4 w-1/2 bg-white/10 rounded-full"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="aspect-square bg-white/10 rounded-2xl"></div>
                         <div className="aspect-square bg-white/10 rounded-2xl"></div>
                      </div>
                  </div>
               </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

