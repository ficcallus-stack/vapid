"use client";

import { useState } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { StripeProvider } from "@/components/StripeProvider";
import { EmbeddedCheckout } from "./EmbeddedCheckout";
import { isInstantBooking, calculateInstantRate } from "@/lib/pricing-utils";

interface PaymentStepProps {
  booking: any;
  nanny: any;
  savedCards: any[];
}

export function PaymentStep({ booking, nanny, savedCards }: PaymentStepProps) {
  const [loading, setLoading] = useState(false);
  
  // Pricing Constants (Align with booking-actions.ts)
  const EXTRA_CHILD_HOURLY = 5;
  const EXTRA_CHILD_WEEKLY = 150;
  const STRIPE_FEE_RATE = 0.029;
  const KINDRED_FEE_RATE = 0.046;

  // Re-calculate breakdown for display
  const hourlyRate = parseFloat(nanny.hourlyRate) || 35;
  const weeklyRate = parseFloat(nanny.weeklyRate) || 1200;
  const isRetainer = booking.hiringMode === "retainer";
  const extraChildren = Math.max(0, booking.childCount - 1);
  
  const totalHours = isRetainer ? 40 : (Object.values(booking.refinedSchedule || {}).filter(Boolean).length * 4);
  
  // Instant Premium Logic
  const isInstant = booking.isInstant;
  const activeHourlyRate = isInstant ? calculateInstantRate(hourlyRate) : hourlyRate;
  const activeWeeklyRate = isInstant ? calculateInstantRate(weeklyRate) : weeklyRate;

  const baseCare = isRetainer ? activeWeeklyRate : (totalHours * activeHourlyRate);
  const extraChildPremium = extraChildren * (isRetainer ? EXTRA_CHILD_WEEKLY : (totalHours * EXTRA_CHILD_HOURLY));
  
  const subtotal = baseCare + extraChildPremium;
  const stripeFee = subtotal * STRIPE_FEE_RATE;
  const kindredFee = subtotal * KINDRED_FEE_RATE;
  const total = subtotal + stripeFee + kindredFee;

  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleSecureFunds = async () => {
    if (clientSecret) return; // Already initialized

    setLoading(true);
    try {
      const { createBookingPaymentIntentAction } = await import("@/lib/actions/booking-actions");
      const res = await createBookingPaymentIntentAction({ bookingId: booking.id });
      if (res.clientSecret) {
        setClientSecret(res.clientSecret);
      }
    } catch (err) {
      console.error(err);
      alert("Payment initialization failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Left Side: Content & Payment */}
      <div className="lg:col-span-7 space-y-12">
        <header className="space-y-4">
          <h1 className="text-5xl font-extrabold tracking-tight text-primary font-headline leading-tight italic">Secure your booking.</h1>
          <p className="text-xl text-on-surface-variant font-body leading-relaxed max-w-xl">
              Your payment is held in a protected escrow account and only released when the care session is successfully completed.
          </p>
        </header>

        {/* Peace of Mind Guarantee */}
        <div className="bg-tertiary rounded-[2.5rem] p-10 flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group shadow-xl shadow-tertiary/20">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <MaterialIcon name="security" className="text-9xl" />
          </div>
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:rotate-12">
            <MaterialIcon name="verified_user" className="text-primary text-4xl" fill />
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-primary font-headline mb-3 italic">Peace of Mind Guarantee</h3>
            <p className="text-on-tertiary/70 leading-relaxed mb-6 font-medium">
              KindredCare holds your payment in a neutral account. Funds are only transferred once you confirm the care was provided. If your caregiver cancels, you get a 100% immediate refund.
            </p>
            <div className="flex flex-wrap gap-6">
              <span className="flex items-center gap-2 text-[10px] font-black text-on-tertiary uppercase tracking-wider">
                <MaterialIcon name="check_circle" className="text-lg" fill /> 100% Refundable
              </span>
              <span className="flex items-center gap-2 text-[10px] font-black text-on-tertiary uppercase tracking-wider">
                <MaterialIcon name="lock" className="text-lg" fill /> Bank-Grade Security
              </span>
            </div>
          </div>
        </div>

        {/* Select Payment Method */}
        <section className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary font-headline italic">Selection & Security</h2>
          </div>
          
          <AnimatePresence mode="wait">
            {!clientSecret ? (
              <motion.div 
                key="placeholder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <button 
                  onClick={handleSecureFunds}
                  disabled={loading}
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-outline-variant rounded-[1rem] hover:border-secondary hover:bg-secondary/5 transition-all group active:scale-95 disabled:opacity-50"
                >
                  <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-primary group-hover:bg-secondary group-hover:text-white transition-all mb-4">
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <MaterialIcon name="add_card" className="text-3xl" />
                    )}
                  </div>
                  <span className="font-bold text-primary uppercase text-[10px] tracking-widest leading-none">Initialize Secure Payment</span>
                  <span className="text-[10px] text-on-surface-variant/60 mt-2 font-black uppercase tracking-tighter">Credit, Debit, or Apple Pay</span>
                </button>
                <div className="hidden md:flex flex-col items-center justify-center p-8 bg-surface-container-low/30 rounded-[1rem] border border-outline-variant/30 opacity-40">
                  <MaterialIcon name="shield" className="text-4xl mb-2 text-primary" fill />
                  <span className="text-[9px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="checkout"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="bg-white p-1 rounded-[1.5rem]"
              >
                <StripeProvider clientSecret={clientSecret}>
                  <EmbeddedCheckout bookingId={booking.id} />
                </StripeProvider>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Trust Badges */}
        <div className="pt-8 border-t border-outline-variant/40 flex flex-wrap gap-12">
          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
            <MaterialIcon name="enhanced_encryption" className="text-primary text-3xl" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">AES-256 Encryption</span>
          </div>
          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
            <MaterialIcon name="payments" className="text-primary text-3xl" fill />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">Stripe Secure</span>
          </div>
          <div className="flex items-center gap-3 opacity-60 grayscale hover:grayscale-0 transition-all">
            <MaterialIcon name="verified" className="text-primary text-3xl" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">PCI DSS Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Side: Sticky Summary Sidebar */}
      <aside className="lg:col-span-5 lg:sticky lg:top-28">
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(29,53,87,0.1)] p-10 border border-outline-variant/20 relative overflow-hidden group">
          <div className="text-center mb-10">
            <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] block mb-4">Booking Summary</span>
            <h3 className="text-2xl font-bold text-primary font-headline italic tracking-tighter">Professional Home Care</h3>
          </div>

          <div className="flex items-center gap-6 mb-12 p-6 bg-surface rounded-[1rem] border border-outline-variant/30 shadow-sm">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-md skew-x-1 rotate-1 border-2 border-white">
                <img alt={nanny.name} className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/initials/svg?seed=${nanny.name}`} />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-secondary text-white p-1 rounded-full shadow-lg">
                <MaterialIcon name="verified" className="text-sm block" fill />
              </div>
            </div>
            <div>
              <h4 className="font-headline font-black italic text-primary text-2xl mb-1">{nanny.name}</h4>
              <div className="flex items-center gap-1.5 opacity-60 font-black uppercase text-[9px] tracking-widest text-slate-400">
                 Verified Premium Partner
              </div>
            </div>
          </div>

          <div className="space-y-5 mb-10">
             <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
               <span className="text-on-surface-variant font-medium">Base Care Rate</span>
               <span className="text-primary">${baseCare.toFixed(2)}</span>
             </div>
             {isInstant && (
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-rose-600 animate-pulse">
                  <span className="font-medium italic">Instant Priority (20% Premium)</span>
                  <span>Applied</span>
                </div>
             )}
            {extraChildPremium > 0 && (
               <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-secondary">
                 <span className="font-medium">Additional Child (x{extraChildren})</span>
                 <span>+${extraChildPremium.toFixed(2)}</span>
               </div>
            )}
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-300 italic">
              <span className="font-medium font-inter">Stripe Processing (2.9%)</span>
              <span className="font-plus-jakarta">${stripeFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-300 italic">
              <span className="font-medium font-inter">Kindred Platform Fee (4.6%)</span>
              <span className="font-plus-jakarta">${kindredFee.toFixed(2)}</span>
            </div>
            
            <div className="pt-8 border-t border-outline-variant/60">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Total to Escrow</span>
                <span className="text-5xl font-black text-primary font-headline tracking-tighter leading-none italic">${total.toFixed(0)}</span>
              </div>
              <div className="flex justify-end mt-2">
                <span className="text-[9px] font-black text-white bg-secondary px-3 py-1 rounded-full uppercase tracking-widest">100% REFUNDABLE</span>
              </div>
            </div>
          </div>

          {!clientSecret && (
            <button 
              onClick={handleSecureFunds}
              disabled={loading}
              className="w-full py-6 bg-primary text-white rounded-2xl font-headline font-black text-lg uppercase tracking-[0.1em] flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:bg-primary-container hover:-translate-y-1 active:scale-95 transition-all mb-6 group"
            >
              {loading ? (
                 <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                 <>
                   <MaterialIcon name="lock" className="text-xl group-hover:rotate-12 transition-transform" />
                   Secure Funds & Finalize
                 </>
              )}
            </button>
          )}
          
          <p className="text-[10px] leading-relaxed text-on-surface-variant/40 text-center italic font-inter px-4 font-bold uppercase tracking-widest">
            By securing funds, you authorize KindredCare to hold this amount. 
             Payment is only released to {nanny.name.split(" ")[0]} after the session ends.
          </p>
        </div>

        <div className="mt-8 bg-secondary-fixed/20 p-6 rounded-[2rem] border border-secondary/10 flex gap-4">
           <MaterialIcon name="verified_user" className="text-secondary" fill />
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-primary">High-Trust Platform</p>
              <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed mt-1">
                 Kindred handles the taxes, background checks, and professional payments so you can focus on your family.
              </p>
           </div>
        </div>
      </aside>

    </div>
  );
}
