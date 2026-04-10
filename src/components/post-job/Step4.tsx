import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { StripeProvider } from "@/components/StripeProvider";
import { getPaymentIntentStatus, sendReceiptEmail, checkIsPremium } from "@/app/dashboard/parent/post-job/actions";
import { useToast } from "@/components/Toast";

interface Step4Props {
  data: any;
  onNext: (paymentIntentId: string) => void;
  onBack: () => void;
}

function Step4Inner({ data, updateData, onNext, total, paymentIntentId, hours, subtotal, fee, featuredFee, boostFee, priorityFee, isUpdatingIntent }: { data: any, updateData: any, onNext: (id: string) => void, total: number, paymentIntentId: string, hours: number, subtotal: number, fee: number, featuredFee: number, boostFee: number, priorityFee: number, isUpdatingIntent: boolean }) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const { showToast } = useToast();

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || isUpdatingIntent) return;

    setIsProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/parent/post-job`,
      },
      redirect: "if_required", 
    });

    if (error) {
      setErrorMessage(error.message || "Something went wrong with your payment.");
      setIsProcessing(false);
    } else {
      setIsSuccess(true);
    }
  };

  const handleSendEmail = async () => {
    setIsEmailSending(true);
    try {
      await sendReceiptEmail({
        amount: total,
        hours,
        rate: data.minRate || 25,
        fee: fee + featuredFee + boostFee,
        transactionId: paymentIntentId
      });
      showToast("Receipt sent to your email!", "success");
    } catch (err: any) {
      showToast("Failed to send email. Please try again.", "error");
    } finally {
      setIsEmailSending(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-2xl border border-outline-variant/10 text-center space-y-8 relative overflow-hidden">
          {/* Decorative background for success */}
          <div className="absolute top-0 left-0 w-full h-2 bg-tertiary"></div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-tertiary/5 rounded-full blur-3xl"></div>

          <div className="w-24 h-24 bg-tertiary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <MaterialIcon name="verified" className="text-6xl text-tertiary" fill />
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black font-headline text-primary tracking-tight">Escrow Authorized!</h2>
            <p className="text-on-surface-variant font-medium">Your deposit of ${total.toFixed(2)} is secured in Kindred Escrow.</p>
          </div>

          <div className="bg-surface-container-low rounded-2xl p-6 text-left space-y-4 border border-outline-variant/5">
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant/10">
              <span className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60">Transaction ID</span>
              <span className="text-sm font-mono font-bold text-primary">{paymentIntentId.slice(-12).toUpperCase()}</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Care Hours ({hours}h @ ${data.minRate}/hr)</span>
                <span className="font-bold text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-on-surface-variant">Platform Service Fee (7.5%)</span>
                <span className="font-bold text-primary">${fee.toFixed(2)}</span>
              </div>
              {(featuredFee > 0 || boostFee > 0 || priorityFee > 0) && (
                <div className="flex justify-between text-sm text-secondary font-bold">
                  <span>Premium Upgrades</span>
                  <span>+${(featuredFee + boostFee + priorityFee).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-black pt-2 border-t border-outline-variant/10">
                <span className="text-primary">Total Secure Deposit</span>
                <span className="text-primary font-headline">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => onNext(paymentIntentId)}
              className="w-full py-5 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              Continue to Final Review
              <MaterialIcon name="arrow_forward" />
            </button>
            <button 
              onClick={handleSendEmail}
              disabled={isEmailSending}
              className="w-full py-4 bg-surface-container-high text-primary rounded-2xl font-bold text-xs hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <MaterialIcon name={isEmailSending ? "sync" : "mail"} className={cn("text-lg", isEmailSending && "animate-spin")} />
              {isEmailSending ? "Sending..." : "Send Copy to my Email"}
            </button>
          </div>

          <p className="text-[10px] text-on-surface-variant/60 font-medium italic">
            Funds will only be released after you approve completed work milestones.
          </p>
        </div>
      </div>
    );
  }

  const minRate = data.minRate || 25;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left Column: Payment & Escrow Info */}
      <div className="lg:col-span-7 space-y-10">
        <section>
          <div className="flex items-center gap-3 mb-4">
             <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">Secure Escrow</span>
             <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest opacity-40">Phase 4/5</span>
          </div>
          <h1 className="text-4xl font-extrabold text-primary font-headline tracking-tight mb-4 leading-tight">
            Authorize your booking deposit
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl">
            We hold your funds securely and only release them to your caregiver once the job is completed to your satisfaction.
          </p>
        </section>

        {/* Boost Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <button 
            type="button"
            onClick={() => updateData({ isFeatured: !data.isFeatured })}
            className={cn(
               "p-6 rounded-2xl border transition-all text-left relative overflow-hidden group",
               data.isFeatured 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]" 
                : "bg-surface-container-lowest border-outline-variant/15 hover:bg-slate-50"
            )}
           >
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", data.isFeatured ? "bg-white/20" : "bg-primary/10")}>
                    <MaterialIcon name="star" className={data.isFeatured ? "text-white" : "text-primary"} fill />
                 </div>
                 <span className={cn("text-lg font-black", data.isFeatured ? "text-white" : "text-primary")}>+$10</span>
              </div>
              <h3 className="font-headline font-bold text-lg mb-1 relative z-10">Featured Job</h3>
              <p className={cn("text-xs leading-relaxed relative z-10", data.isFeatured ? "text-white/80" : "text-on-surface-variant")}>
                Get highlighted in search results and stay at the top of the nanny dashboard.
              </p>
              <MaterialIcon name="auto_awesome" className="absolute -bottom-4 -right-4 text-7xl opacity-10" />
           </button>

           <button 
            type="button"
            onClick={() => updateData({ isBoosted: !data.isBoosted })}
            className={cn(
               "p-6 rounded-2xl border transition-all text-left relative overflow-hidden group",
               data.isBoosted 
                ? "bg-secondary text-white border-secondary shadow-lg shadow-secondary/20 scale-[1.02]" 
                : "bg-surface-container-lowest border-outline-variant/15 hover:bg-slate-50"
            )}
           >
              <div className="flex justify-between items-start mb-4 relative z-10">
                 <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", data.isBoosted ? "bg-white/20" : "bg-secondary/10")}>
                    <MaterialIcon name="bolt" className={data.isBoosted ? "text-white" : "text-secondary"} fill />
                 </div>
                 <span className={cn("text-lg font-black", data.isBoosted ? "text-white" : "text-secondary")}>+$5</span>
              </div>
              <h3 className="font-headline font-bold text-lg mb-1 relative z-10">Priority SMS Boost</h3>
              <p className={cn("text-xs leading-relaxed relative z-10", data.isBoosted ? "text-white/80" : "text-on-surface-variant")}>
                Instant push notifications & SMS sent to the top 20 verified nannies near you.
              </p>
              <MaterialIcon name="send" className="absolute -bottom-4 -right-4 text-7xl opacity-10" />
           </button>
        </div>

        {/* Credit Card Form */}
        <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/15 relative">
          {isUpdatingIntent && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-30 flex items-center justify-center rounded-2xl">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <span className="text-[10px] font-black font-headline text-primary uppercase tracking-widest">Updating Totals...</span>
               </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold font-headline text-primary uppercase tracking-tighter">Payment Details</h2>
            <div className="flex gap-2">
              <MaterialIcon name="credit_card" className="text-outline-variant" />
            </div>
          </div>
          <form className="space-y-6" onSubmit={handlePay}>
            <PaymentElement />
            {errorMessage && <p className="text-sm text-error font-medium">{errorMessage}</p>}
          </form>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:col-span-5">
        <div className="sticky top-32 space-y-6">
          <div className="bg-primary text-white rounded-[2.5rem] p-10 shadow-2xl shadow-primary-container/20 overflow-hidden relative group">
            {/* Decorative Gradient Element */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container/30 rounded-full blur-[80px] group-hover:scale-125 transition-transform duration-1000"></div>
            
            <h2 className="text-2xl font-bold font-headline mb-8 relative z-10 italic">Job Summary</h2>
            
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-on-primary-container text-[10px] uppercase tracking-[0.2em] font-black font-label opacity-60">Care Period</p>
                  <p className="text-lg font-bold tracking-tight">{data.startDate || "Upcoming"} • {hours} Estimated Hours</p>
                </div>
                <MaterialIcon name="calendar_today" className="text-primary-fixed-dim" />
              </div>
              
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-on-primary-container text-[10px] uppercase tracking-[0.2em] font-black font-label opacity-60">Service</p>
                  <p className="text-lg font-bold tracking-tight">{data.duration || "Standard daytime care"}</p>
                </div>
                <MaterialIcon name="child_care" className="text-primary-fixed-dim" />
              </div>
              
              <div className="pt-8 mt-8 border-t border-white/10 space-y-4">
                <div className="flex justify-between text-on-primary-container font-medium">
                  <span className="text-sm">Estimated Total</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-on-primary-container font-medium">
                  <span className="text-sm">Platform Service Fee (7.5%)</span>
                  <span className="font-bold">${fee.toFixed(2)}</span>
                </div>
                {featuredFee > 0 && (
                  <div className="flex justify-between text-secondary font-bold">
                    <span className="text-sm">Featured Upgrade</span>
                    <span>$10.00</span>
                  </div>
                )}
                {boostFee > 0 && (
                  <div className="flex justify-between text-secondary font-bold">
                    <span className="text-sm">SMS Priority Boost</span>
                    <span>$5.00</span>
                  </div>
                )}
                {priorityFee > 0 && (
                  <div className="flex justify-between text-secondary font-bold">
                    <span className="text-sm">Fast-Track Priority</span>
                    <span>$10.00</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-3xl font-black pt-4 border-t border-white/5">
                  <span className="font-headline tracking-tighter">Deposit Due</span>
                  <span className="font-headline tracking-tighter">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handlePay}
              disabled={isProcessing || !stripe || !elements || isUpdatingIntent}
              className="w-full mt-10 bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-white font-black uppercase tracking-widest text-xs py-5 rounded-2xl transition-all scale-100 active:scale-95 shadow-xl shadow-black/10 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isProcessing ? "Processing..." : "Authorize Escrow Deposit"}
              <MaterialIcon name="chevron_right" />
            </button>
            
            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-on-primary-container/60">
              <MaterialIcon name="lock" className="text-sm" />
              <span>Secure Bank-grade Encryption</span>
            </div>
          </div>

          {/* Testimonial Card */}
          <div className="bg-tertiary-fixed p-8 rounded-[2rem] flex gap-5 items-start border border-outline-variant/10 shadow-sm">
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-md rotate-3">
              <img 
                className="w-full h-full object-cover" 
                alt="Elena R." 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAyGVAePrYMTZ7XtnWeGLkd2-Zv1ADxQnpzqoNvWhTGI1bye6X63Fh6s6MfWz-ByDTd-FwOihEsbp69jDbc6G8AxZYv15qQe3JK1tZtqL3imh9SbZs68tR27KhwpAnW9Io0AlfZPcZCYRRYWlGA7Z7CqY546UtFrHuuEziAigUbHhXYuIa-02CUgNyUjFwLuws12hvdJeKidAEodoYWVbkTCaCx-xnDLRezQMrCRW-nQKeKUwvYwfFTPqmB0_uFUvoFW4IcsdZ2_GQ" 
              />
            </div>
            <div>
              <p className="text-sm text-on-tertiary-fixed-variant italic leading-relaxed font-medium">
                "The escrow system gave me such peace of mind. Knowing the funds are ready actually helped me attract a better caregiver faster!"
              </p>
              <p className="text-[10px] font-black text-on-tertiary-fixed uppercase tracking-widest mt-3">
                — Elena R., Kindred Parent
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Step4({ data, updateData, onNext, onBack }: Step4Props & { updateData: any }) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [paymentIntentId, setPaymentIntentId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingIntent, setIsUpdatingIntent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [alreadyAuthorizedInfo, setAlreadyAuthorizedInfo] = useState<{ id: string; amount: number } | null>(null);

  const minRate = data.minRate || 25;
  const hours = Object.values(data.schedule || {}).filter(Boolean).length * 2 || 4; // Default to 4h if no schedule
  const subtotal = minRate * hours;
  const fee = subtotal * 0.075;
  const featuredFee = data.isFeatured ? 10.0 : 0;
  const boostFee = data.isBoosted ? 5.0 : 0;
  const priorityFee = data.isFastTrack ? 10.0 : 0;
  const total = subtotal + fee + featuredFee + boostFee + priorityFee;

  useEffect(() => {
    let isMounted = true;

    async function initPayment() {
      // Don't re-init if we are loading
      if (isLoading) return;

      // If we already have a secret, we just want to update the amount
      if (clientSecret) {
         setIsUpdatingIntent(true);
         try {
            await fetch("/api/stripe/update-payment-intent", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify({
                  paymentIntentId,
                  amount: Math.round(total * 100),
               }),
            });
         } catch (err) {
            console.error("Failed to update intent", err);
         } finally {
            setIsUpdatingIntent(false);
         }
         return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      
      try {
        const isPremium = await checkIsPremium();
        if (isPremium) {
          // Premium users get posting fees waived
          setAlreadyAuthorizedInfo({ id: "premium_waived", amount: Infinity });
          setPaymentIntentId("premium_waived");
          setIsLoading(false);
          return;
        }

        // 1. Check if we already have a payment intent ID in the draft
        if (data.stripePaymentIntentId && data.stripePaymentIntentId !== "premium_waived") {
           try {
              const status = await getPaymentIntentStatus(data.stripePaymentIntentId);
              // If it's already authorized/paid, we can skip fresh creation
              if (['requires_capture', 'succeeded', 'processing'].includes(status.status)) {
                 if (status.amount >= (total - 0.01)) { // Allow 1 cent rounding diff
                    setAlreadyAuthorizedInfo({ id: status.id, amount: status.amount });
                    setPaymentIntentId(status.id);
                    setIsLoading(false);
                    return;
                 }
              }
           } catch (e) {
              console.warn("Failed to verify existing PI, will create new one", e);
           }
        }
        
        // 2. Create fresh intent if nothing reusable was found
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(total * 100),
            description: `KindredCare Escrow: ${hours} hours @ $${minRate}/hr`,
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to initialize payment");
        }
        
        if (!isMounted) return;

        const resData = await res.json();
        setClientSecret(resData.clientSecret);
        setPaymentIntentId(resData.paymentIntentId);
      } catch (err: any) {
        if (isMounted) {
          console.error("Payment init error:", err);
          setErrorMessage(err.message || "Could not connect to the payment server.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initPayment();
    return () => { isMounted = false; };
  }, [total]); // Re-init OR update if the total amount changes

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-headline font-bold text-primary italic">Securely connecting to Kindred Escrow...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-500">
        <div className="max-w-md p-8 bg-error/5 text-error rounded-[2.5rem] border border-error/20 shadow-xl shadow-error/5">
          <MaterialIcon name="error" className="text-4xl mb-4" />
          <p className="font-headline font-bold text-lg mb-2">Connection Error</p>
          <p className="text-sm opacity-80 mb-8 leading-relaxed">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-4 bg-error text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-error/20 hover:opacity-90 active:scale-95 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // If we already have a sufficient authorization, show a modified success screen
  if (alreadyAuthorizedInfo && alreadyAuthorizedInfo.amount >= total) {
    return (
      <div className="max-w-2xl mx-auto py-12 animate-in fade-in zoom-in-95 duration-500">
        <div className="bg-surface-container-lowest rounded-[2.5rem] p-10 shadow-2xl border border-outline-variant/10 text-center space-y-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <MaterialIcon name="verified" className="text-6xl text-emerald-600" fill />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black font-headline text-primary tracking-tight">Payment Secured!</h2>
            <p className="text-on-surface-variant font-medium">You already authorized ${alreadyAuthorizedInfo.amount.toFixed(2)} for this job.</p>
          </div>
          <div className="bg-emerald-50/50 rounded-2xl p-6 text-left border border-emerald-100 flex items-start gap-4">
             <MaterialIcon name="info" className="text-emerald-600 shrink-0" />
             <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                We've detected your existing authorization. Since the new total is within this amount, no further payment is required. We'll only capture what is actually worked.
             </p>
          </div>
          <button 
            onClick={() => onNext(alreadyAuthorizedInfo.id)}
            className="w-full py-5 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            Continue to Final Review
            <MaterialIcon name="arrow_forward" />
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center gap-4 animate-in fade-in duration-500">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="font-headline font-bold text-primary italic">Initializing secure payment...</p>
      </div>
    );
  }

  return (
    <StripeProvider clientSecret={clientSecret}>
      <Step4Inner 
        key={paymentIntentId} 
        data={data} 
        updateData={updateData}
        onNext={onNext} 
        total={total} 
        paymentIntentId={paymentIntentId} 
        hours={hours} 
        subtotal={subtotal} 
        fee={fee} 
        featuredFee={featuredFee}
        boostFee={boostFee}
        priorityFee={priorityFee}
        isUpdatingIntent={isUpdatingIntent}
      />
    </StripeProvider>
  );
}
