"use client";

import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format } from "date-fns";
import { useState, useRef } from "react";
import { ChatGuardianModal } from "@/components/chat/ChatGuardianModal";
import { useToast } from "@/components/Toast";
import { calculateInstantRate, isInstantBooking } from "@/lib/pricing-utils";

function MediaPlaceholder({ label, icon = "image_not_supported" }: { label: string; icon?: string }) {
  return (
    <div className="w-full h-full bg-rose-50 border-2 border-dashed border-rose-200 flex flex-col items-center justify-center gap-2 p-4 text-center group hover:bg-rose-100 transition-colors">
      <MaterialIcon name={icon} className="text-rose-400 text-3xl group-hover:scale-110 transition-transform" />
      <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 leading-tight">
        DEBUG: {label}
      </span>
    </div>
  );
}

function AvailabilityStrip({ availability }: { availability: any }) {
  const alwaysAvailable = availability?.alwaysAvailable ?? true;
  const isAvailable = true; // Still "Available" if online, but could be "Managed"
  return (
    <div className={cn(
      "w-full py-3 mb-8 rounded-2xl flex items-center justify-center gap-3 animate-pulse border",
      alwaysAvailable ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-indigo-50 border-indigo-100 text-indigo-700"
    )}>
      <div className={cn("w-2 h-2 rounded-full", alwaysAvailable ? "bg-emerald-500" : "bg-indigo-500")}></div>
      <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">
        {alwaysAvailable ? "Full-Time Ready (Available for New Placements)" : "Ad-Hoc / Part-Time (Managed Weekly Schedule)"}
      </span>
    </div>
  );
}

export function NannyPublicProfileClient({ nanny, reviews }: { nanny: any; reviews: any[] }) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isGuardianOpen, setIsGuardianOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const availability = nanny.availability || {};
  const isInstant = isInstantBooking(format(new Date(), "yyyy-MM-dd"), format(new Date(), "HH:mm"));
  
  const hourly = parseFloat(nanny.hourlyRate || "35");
  const weekly = parseFloat(nanny.weeklyRate || (hourly * 40 * 0.85).toFixed(0));
  const savingsPercent = Math.round(((hourly * 40 - weekly) / (hourly * 40)) * 100);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { showToast } = useToast();
  
  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0";
  const firstName = nanny.name.split(' ')[0];
  const lastName = nanny.name.split(' ').slice(1).join(' ');

  // Skills mapping
  const skills = [...(nanny.coreSkills || []), ...(nanny.specializations || [])].slice(0, 12);
  
  // Logistics & Safety
  const safetyProtocols = (nanny.logistics || []).filter((l: string) => l.includes("Protocol: ")).map((l: string) => l.replace("Protocol: ", ""));
  const languages = (nanny.logistics || []).filter((l: string) => 
    ["Native English", "Fluent Spanish", "Bilingual", "ASL Basics", "French Proficiency"].includes(l) || 
    (!["Dog Friendly", "Cat Friendly", "Comfortable with Other Pets", "No Allergies", "Valied Driver's License", "Clean DMV Record", "Mobile In Public Transit", "Clean Driving Record"].includes(l) && !l.includes("Protocol"))
  );

  return (
    <div className="bg-surface font-body text-on-surface">
      <main className="pt-24 pb-20 max-w-7xl mx-auto px-6">
        
        {/* Availability Strip */}
        <AvailabilityStrip availability={nanny.availability} />

        {/* Editorial Hero Section */}
        <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20 items-center">
          <div className="lg:col-span-7 relative">
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-secondary-fixed opacity-30 rounded-full blur-3xl"></div>
            <div className="relative overflow-hidden squircle editorial-shadow aspect-[4/5] md:aspect-[3/2] bg-black group">
              {nanny.videoUrl ? (
                <>
                  <video 
                    ref={videoRef}
                    src={nanny.videoUrl} 
                    className={cn("w-full h-full object-cover transition-all duration-700", !isVideoPlaying && "brightness-75")}
                    poster={nanny.profileImageUrl || nanny.photos?.[0]}
                    playsInline
                    loop
                    muted={!isVideoPlaying}
                    onPlaying={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />
                  {!isVideoPlaying && (
                    <div 
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] cursor-pointer"
                      onClick={() => videoRef.current?.play()}
                    >
                      <div className="w-20 h-20 bg-white/20 backdrop-blur-2xl rounded-full flex items-center justify-center group-hover:scale-110 transition-all border border-white/20 shadow-2xl">
                        <MaterialIcon name="play_arrow" className="text-white text-5xl" fill />
                      </div>
                      <span className="mt-4 text-[10px] font-black text-white uppercase tracking-[0.3em]">Watch Intro Video</span>
                    </div>
                  )}
                  {isVideoPlaying && (
                    <button 
                      onClick={() => {
                        videoRef.current?.pause();
                        setIsVideoPlaying(false);
                      }}
                      className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md p-3 rounded-xl border border-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MaterialIcon name="pause" />
                    </button>
                  )}
                </>
              ) : (
                <img 
                  alt={`${nanny.name} professional portrait`} 
                  className="w-full h-full object-cover" 
                  src={nanny.profileImageUrl || nanny.photos?.[0]} 
                />
              )}
            </div>
            <div className="absolute -bottom-8 -right-8 flex flex-col gap-3">
              {nanny.isVerified && (
                <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                  <MaterialIcon name="verified" className="text-secondary" fill />
                  <span className="font-headline font-bold text-primary">Verified Professional</span>
                </div>
              )}
              {(nanny.isPremium || (nanny.specializations || []).includes("Global Care")) && (
                <div className="bg-primary px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <MaterialIcon name="military_tech" className="text-primary-fixed" fill />
                  <span className="font-headline font-bold text-on-primary">Global Care Professional <span className="text-primary-fixed">Tier 1</span></span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 pt-8 lg:pt-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-secondary font-bold tracking-widest text-sm uppercase">PREMIUM CAREGIVER</span>
              <span className="text-on-surface-variant/40">•</span>
              <span className="flex items-center gap-1 text-on-surface-variant font-bold text-sm uppercase tracking-widest">
                <MaterialIcon name="location_on" className="text-sm" />
                {nanny.location || "USA"}
              </span>
            </div>
            <h1 className="text-6xl md:text-7xl font-headline font-extrabold text-primary leading-none mb-6">
              {nanny.name}
            </h1>
            
            {isInstant && (
              <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2.5rem] mb-10 flex items-center gap-6 animate-in slide-in-from-left duration-700 shadow-sm">
                 <div className="bg-rose-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
                    <MaterialIcon name="bolt" className="text-3xl" fill />
                 </div>
                 <div>
                    <h4 className="text-rose-700 font-headline font-black italic text-xl tracking-tight leading-none mb-1">Ready to start now</h4>
                    <p className="text-rose-600/70 text-[11px] font-medium leading-relaxed italic">
                      {firstName} can arrive within 4 hours. Same-day care is billed at a 20% premium.
                    </p>
                 </div>
              </div>
            )}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex text-secondary">
                {[1,2,3,4,5].map(s => (
                  <MaterialIcon key={s} name="star" fill={s <= Math.round(Number(avgRating))} />
                ))}
              </div>
              <span className="text-on-surface-variant font-medium">({avgRating} • {reviews.length} Reviews)</span>
            </div>
            <p className="text-xl text-on-surface-variant leading-relaxed mb-8">
              {nanny.bio?.split('.')[0]}. Dedicated partner for modern families with over {nanny.experienceYears} years of experience.
            </p>

            <div className="flex gap-4 mb-8">
              <button 
                onClick={() => setIsGuardianOpen(true)}
                className="bg-surface-container-high text-primary font-bold px-6 py-3 rounded-2xl hover:bg-surface-container-highest transition-all flex items-center gap-2 text-sm shadow-sm border border-outline-variant/10 group"
              >
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse group-hover:scale-120 transition-transform" />
                Message {firstName}
              </button>
              {nanny.isOccupied ? (
                <div className="w-full bg-rose-50 border border-rose-100 text-rose-700 font-bold px-6 py-3 rounded-2xl flex items-center gap-3 text-sm shadow-sm">
                  <MaterialIcon name="event_busy" className="text-rose-500" />
                  Active Booking with another family
                </div>
              ) : (
                <Link 
                  href={`/nannies/${nanny.id}/book/schedule`}
                  className="bg-primary text-on-primary font-bold px-6 py-3 rounded-2xl hover:opacity-90 transition-all flex items-center gap-2 text-sm shadow-lg shadow-primary/10"
                >
                  <MaterialIcon name="event_available" className="text-sm" />
                  Book {firstName}
                </Link>
              )}
            </div>

            <ChatGuardianModal 
                isOpen={isGuardianOpen} 
                onClose={() => setIsGuardianOpen(false)}
                caregiverId={nanny.id}
                caregiverName={nanny.name}
            />

            <div className="flex gap-3 flex-wrap">
              {nanny.certifications?.slice(0, 3).map((cert: string) => (
                <span key={cert} className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-4 py-2 rounded-full text-sm font-semibold">
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Action Gallery & Info Section */}
        <section className="mb-24">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {(nanny.photos || []).filter((p: string) => !!p).map((photo: string, index: number) => (
              <div key={index} className="squircle overflow-hidden aspect-square">
                <img 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                  src={photo} 
                  alt={`Gallery ${index + 1}`} 
                />
              </div>
            ))}
          </div>
        </section>



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Bio & Reviews */}
          <div className="lg:col-span-2 space-y-16">
            
            {/* Professional Statement */}
            <section>
              <h2 className="text-3xl font-headline font-bold text-primary mb-8">Professional Statement</h2>
              <div className="space-y-6 text-on-surface-variant leading-relaxed text-lg">
                <p className="italic text-primary font-headline text-2xl font-medium border-l-4 border-secondary-fixed-dim pl-6 mb-8">
                  "{nanny.bio?.split('.')[0] || "I believe that every moment spent with a child is an opportunity for discovery."}"
                </p>
                <p>
                  {nanny.bio}
                </p>
                <p>
                  With {nanny.experienceYears} years of experience as a career nanny, {firstName} has developed a holistic approach to child development, ensuring the household runs smoothly so families can focus on their time together.
                </p>
              </div>
            </section>

            {/* Specialized Skills */}
            <section>
              <h2 className="text-3xl font-headline font-bold text-primary mb-8">Specialized Skills</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {skills.map(skill => (
                  <div key={skill} className="flex items-center gap-3 bg-surface-container-low p-5 rounded-2xl border border-surface-container-high">
                    <MaterialIcon name="check_circle" className="text-secondary" fill />
                    <span className="font-semibold text-primary">{skill}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Trust & Safety Profile */}
            <section className="bg-surface-container-low rounded-[2.5rem] p-10">
              <h2 className="text-2xl font-headline font-bold text-primary mb-8 flex items-center gap-3">
                <MaterialIcon name="security" className="text-secondary" />
                Trust & Safety Profile
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Identity</span>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <MaterialIcon name="check_circle" className="text-green-600 text-sm" fill />
                    Fully Vetted
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Background Check</span>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <MaterialIcon name="check_circle" className="text-green-600 text-sm" fill />
                    {nanny.backgroundCheckDate 
                      ? `Clear (${format(new Date(nanny.backgroundCheckDate), 'MMM yyyy')})` 
                      : "Clear (Active)"}
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Exam Score</span>
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <MaterialIcon name="workspace_premium" className="text-secondary text-sm" fill />
                    {nanny.maxScore ? `Exam Score: ${nanny.maxScore}%` : "Exam Score: N/A"}
                  </div>
                </div>
              </div>
            </section>

            {/* Family Testimonials */}
            <section>
              <div className="flex justify-between items-end mb-10">
                <h2 className="text-3xl font-headline font-bold text-primary">Family Testimonials</h2>
                <div className="text-right">
                  <div className="text-4xl font-headline font-extrabold text-primary">{avgRating}</div>
                  <div className="text-sm text-on-surface-variant font-semibold">Platform Rating</div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                {reviews.length > 0 ? reviews.map((review, idx) => (
                  <div key={idx} className="bg-surface-container-lowest p-8 rounded-3xl editorial-shadow">
                    <div className="flex gap-1 text-secondary mb-4">
                      {[1,2,3,4,5].map(s => (
                        <MaterialIcon key={s} name="star" className="text-sm" fill={s <= review.rating} />
                      ))}
                    </div>
                    <p className="text-on-surface-variant italic mb-6">"{review.comment}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center font-bold text-primary">
                        {review.reviewer.fullName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-primary text-sm">{review.reviewer.fullName}</div>
                        <div className="text-xs text-on-surface-variant">Verified Placement</div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="md:col-span-2 text-center py-10 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                     <p className="text-on-surface-variant italic">New caregiver establishing legacy testimonials...</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Booking & Details */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-8">
              
              {/* Booking Module */}
              <div className="bg-primary p-1 rounded-[2.5rem] shadow-2xl overflow-hidden">
                <div className="bg-white rounded-[2.3rem] p-8">
                  <h3 className="text-2xl font-headline font-bold text-primary mb-2">Reservations</h3>
                  {isInstant && (
                    <div className="bg-rose-50/50 border border-rose-100/50 p-4 rounded-2xl mb-8 flex items-start gap-3">
                       <MaterialIcon name="info" className="text-rose-500 text-sm mt-0.5" fill />
                       <p className="text-[10px] text-rose-700/80 font-bold uppercase tracking-widest leading-relaxed">
                         Ready within 4h. Same-day rate applies (20% premium).
                       </p>
                    </div>
                  )}
                  <div className="space-y-4 mb-8">
                    <label className="block group cursor-pointer">
                      <input checked className="hidden peer" name="booking_type" type="radio" />
                      <div className="flex justify-between items-center p-6 rounded-2xl border-2 border-surface-container-high peer-checked:border-primary peer-checked:bg-primary-fixed transition-all">
                        <div>
                          <span className="block font-bold text-primary text-lg">Hourly Care</span>
                          <span className="text-sm text-on-surface-variant">Ad-hoc scheduling</span>
                        </div>
                        <div className="text-right">
                          {isInstant ? (
                            <>
                              <span className="block font-extrabold text-error text-xl">${calculateInstantRate(nanny.hourlyRate!)}/hr</span>
                              <span className="text-[10px] font-black uppercase text-error/60 bg-error/5 px-2 py-0.5 rounded-full">Instant Rate</span>
                            </>
                          ) : (
                            <span className="block font-extrabold text-primary text-xl">${nanny.hourlyRate}/hr</span>
                          )}
                        </div>
                      </div>
                    </label>
                    <label className={cn("block group cursor-pointer", !(nanny.availability?.alwaysAvailable ?? true) && "opacity-40 cursor-not-allowed")}>
                      <input 
                        className="hidden peer" 
                        name="booking_type" 
                        type="radio" 
                        disabled={!(nanny.availability?.alwaysAvailable ?? true)}
                      />
                      <div className="flex justify-between items-center p-6 rounded-2xl border-2 border-surface-container-high peer-checked:border-primary peer-checked:bg-primary-fixed transition-all relative">
                        <span className="absolute -top-3 left-6 bg-secondary text-on-secondary text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Best Value</span>
                        <div>
                          <span className="block font-bold text-primary text-lg">Weekly Retainer</span>
                          <span className="text-sm text-on-surface-variant">Includes priority bookings</span>
                        </div>
                        <div className="text-right">
                          <span className="block font-extrabold text-primary text-xl">
                            ${isInstant ? calculateInstantRate(weekly) : weekly}/wk
                          </span>
                          <span className="text-[10px] font-bold text-secondary uppercase">Save {savingsPercent}%</span>
                        </div>
                      </div>
                      {!(nanny.availability?.alwaysAvailable ?? true) && (
                        <p className="mt-2 text-[9px] font-black uppercase tracking-widest text-[#875124] italic">
                          Caregiver manages a custom schedule. Please book via Hourly.
                        </p>
                      )}
                    </label>
                  </div>
                  {nanny.isOccupied ? (
                    <div className="w-full bg-rose-50 border border-rose-100 text-rose-700 font-headline font-bold py-5 rounded-2xl text-center text-lg mb-4 flex items-center justify-center gap-2">
                      <MaterialIcon name="lock" />
                      Currently Occupied
                    </div>
                  ) : (
                    <Link 
                      href={`/nannies/${nanny.id}/book/schedule`}
                      className="w-full bg-primary text-on-primary font-headline font-bold py-5 rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-lg mb-4 flex items-center justify-center gap-2"
                    >
                      Book {firstName} Now
                    </Link>
                  )}
                  <p className="text-center text-xs text-on-surface-variant px-6">
                    Cancel for free up to 48 hours before the scheduled start.
                  </p>
                </div>
              </div>

              {/* Logistics & Equipment */}
              <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] editorial-shadow">
                <h4 className="font-headline font-bold text-primary mb-6">Logistics & Equipment</h4>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <MaterialIcon name="directions_car" className="text-secondary" />
                    <div>
                      <div className="font-bold text-primary text-sm">{nanny.hasCar ? 'Own Transportation' : 'Mobile Transit'}</div>
                      <div className="text-xs text-on-surface-variant">{nanny.carDescription || (nanny.hasCar ? "Clean driving record, reliable vehicle" : "Public transit expert")}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 pt-4 border-t border-surface-container-high">
                    <MaterialIcon name="explore" className="text-secondary" />
                    <div className="w-full">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-bold text-primary text-sm">Travel Range</div>
                        <span className="bg-secondary-fixed text-on-secondary-fixed-variant text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Highly Mobile</span>
                      </div>
                      <div className="text-xs text-on-surface-variant mb-3">Willing to travel up to: <span className="font-bold text-primary">{nanny.maxTravelDistance} Miles</span></div>
                      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                        <div className="bg-secondary h-full rounded-full transition-all duration-1000" style={{ width: `${(nanny.maxTravelDistance / 100) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-surface-container-high">
                    <MaterialIcon name="pets" className="text-secondary" />
                    <div>
                      <div className="font-bold text-primary text-sm">Pet Friendly</div>
                      <div className="text-xs text-on-surface-variant">Comfortable with dogs and cats</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 pt-4 border-t border-surface-container-high">
                    <MaterialIcon name="language" className="text-secondary" />
                    <div>
                      <div className="font-bold text-primary text-sm">Language Enrichment</div>
                      <div className="text-xs text-on-surface-variant">
                         {languages.join(", ") || "Native English Proficiency"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-primary text-on-primary py-20 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <span className="text-2xl font-bold tracking-tight text-white mb-6 block">KindredCare</span>
            <p className="text-on-primary-container text-lg leading-relaxed max-w-sm">
              Reimagining childcare as a premium, editorial experience for the modern family.
            </p>
          </div>
          <div>
            <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-primary-fixed">Platform</h5>
            <ul className="space-y-2 text-on-primary-container">
              <li><Link className="hover:text-white transition-colors" href="#">Safety Standards</Link></li>
              <li><Link className="hover:text-white transition-colors" href="#">Pricing Structure</Link></li>
              <li><Link className="hover:text-white transition-colors" href="#">Caregiver Portal</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="font-bold mb-4 uppercase text-xs tracking-widest text-primary-fixed">Support</h5>
            <ul className="space-y-2 text-on-primary-container">
              <li><Link className="hover:text-white transition-colors" href="#">Concierge Service</Link></li>
              <li><Link className="hover:text-white transition-colors" href="#">Terms of Policy</Link></li>
              <li><Link className="hover:text-white transition-colors" href="#">Help Center</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
