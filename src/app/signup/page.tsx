"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase-client";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/Toast";
import { useEffect } from "react";

export default function SignUpPage() {
  const { showToast } = useToast();
  
  const [role, setRole] = useState<"parent" | "caregiver" | null>(null);
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [isCodeValid, setIsCodeValid] = useState<boolean | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [showRefPopup, setShowRefPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize referral code and role from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      validateCode(ref);
    }

    const roleParam = searchParams.get("role") as any;
    if (roleParam === "parent" || roleParam === "caregiver") {
      setRole(roleParam);
    }
  }, [searchParams]);

  const validateCode = async (code: string) => {
    if (!code || code.length < 4) {
      setIsCodeValid(null);
      return;
    }
    setCheckingCode(true);
    try {
      const res = await fetch(`/api/referral/validate?code=${code}`);
      const data = await res.json();
      setIsCodeValid(data.valid);
    } catch {
      setIsCodeValid(false);
    } finally {
      setCheckingCode(false);
    }
  };

  // Handle the signup submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      showToast("Please select your role (Parent or Caregiver) first.", "error");
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, emailAddress, password);

      // Set display name
      await updateProfile(credential.user, { displayName: fullName });

      // Sync to our DB with role
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, fullName, referralCode }),
      });

      showToast("Check your email for a verification code!", "success");
      router.push("/verify-email");
    } catch (err: any) {
      const msg = err.code === "auth/email-already-in-use"
        ? "An account with this email already exists. Please sign in."
        : err.code === "auth/weak-password"
        ? "Password must be at least 6 characters."
        : "Signup failed. Please check your details.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const signUpWithGoogle = async () => {
    if (!role) {
      showToast("Pick a role (Parent/Caregiver) before signing up with Google.", "error");
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
      
      // If no referral code was entered, show the post-signup popup
      if (!referralCode) {
         setShowRefPopup(true);
         return;
      }

      await completeSync();
    } catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") {
        showToast("Social signup failed. Please try email signup.", "error");
      }
    }
  };

  const completeSync = async (codeToUse?: string) => {
    try {
      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
           role: role || "parent", 
           referralCode: codeToUse || referralCode 
        }),
      });
      showToast("Welcome to the Kindred family!", "success");
      router.push("/");
    } catch (error) {
       console.error("Sync error:", error);
       showToast("Account sync failed. Please contact support.", "error");
    }
  };

  return (
    <div className="bg-surface font-body text-on-surface antialiased min-h-screen">

      <main className="min-h-screen pt-32 pb-16 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Referral Popup for Social Signup */}
        {showRefPopup && (
           <div className="fixed inset-0 z-[100] bg-primary/20 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-500">
              <div className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-12 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500 border border-white">
                 <button onClick={() => { setShowRefPopup(false); completeSync(); }} className="absolute top-8 right-8 text-slate-300 hover:text-primary transition-colors">
                    <MaterialIcon name="close" className="text-2xl" />
                 </button>
                 <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary mb-8 shadow-inner">
                    <MaterialIcon name="loyalty" className="text-3xl" fill />
                 </div>
                 <h2 className="text-3xl font-black font-headline text-primary italic tracking-tighter mb-4">Got a Referral?</h2>
                 <p className="text-sm font-medium text-on-surface-variant mb-10 opacity-70">Enter your code to unlock your welcome reward, or skip to start your journey.</p>
                 
                 <div className="space-y-4">
                    <div className="relative">
                       <input 
                         value={referralCode}
                         onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setReferralCode(val);
                            validateCode(val);
                         }}
                         className="w-full bg-slate-50 border border-outline-variant/10 rounded-2xl py-5 px-6 font-black text-primary placeholder:opacity-30 tracking-[0.3em] uppercase text-center focus:ring-4 ring-primary/5 transition-all"
                         placeholder="CODE123"
                       />
                       {isCodeValid && (
                         <div className="absolute right-6 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in-50">
                            <MaterialIcon name="verified" className="text-xl" fill />
                         </div>
                       )}
                    </div>
                    <button 
                      onClick={() => { setShowRefPopup(false); completeSync(); }}
                      className="w-full bg-primary text-white font-black py-5 rounded-2xl uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Complete Signup
                    </button>
                    <button 
                      onClick={() => { setShowRefPopup(false); completeSync(); }}
                      className="w-full py-4 text-slate-400 font-bold uppercase tracking-widest text-[9px] hover:text-primary transition-colors"
                    >
                      Skip For Now
                    </button>
                 </div>
              </div>
           </div>
        )}

        {/* Artistic Background Blurs */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          {/* Branding & Welcome Column (5/12) */}
          <div className="lg:col-span-5 space-y-10 lg:pr-12 text-center lg:text-left">
            <div className="space-y-6">
              <div className="flex justify-center lg:justify-start">
                 <span className="px-4 py-1.5 rounded-full bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em] border border-primary/10">
                   The Circle of Trust
                 </span>
              </div>
              <h1 className="font-headline text-5xl md:text-7xl font-black tracking-tighter text-primary leading-[0.9] italic">
                Elevate your <span className="text-secondary opacity-80">family journey.</span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed font-medium max-w-md mx-auto lg:mx-0">
                Bespoke care for discerning families. Join the Kindred circle and connect with the nation's most trusted professionals.
              </p>
            </div>
            
            <div className="relative group rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/10 border-4 border-white/50 backdrop-blur-sm hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-60 z-10 transition-opacity group-hover:opacity-20 duration-700"></div>
              <img
                alt="Safe and happy family"
                className="w-full aspect-[4/3] object-cover scale-110 group-hover:scale-100 transition-all duration-[3000ms] ease-out"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBepyv5YWMXnwkEFGbrREbn6QFlqC9uiBA99AAXsBMCYo41Nlm0tqzGAZWCyz-tzFF52adiC8EUzhZBPug5HD_SyidpkmbYAZ9AyB2nehR5o-XTu603T8iFpbL-2LcNKHXwFV1cXGWy9Oga00mIZIYFGnz68fTXRPc-cWx63FDmDVx38FnLzijBWod_7DIuX3XvIslPsANnK1-jgxNaWNeZq4kaNLr2hKMhLIHDjwx0HlrYaHXpuMjA9nULFjCCnCzP9XsMKluSx6I"
              />
              <div className="absolute bottom-8 left-8 right-8 z-20">
                 <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <p className="text-white text-xs font-bold italic">"Kindred didn't just find us a nanny, they found us peace."</p>
                 </div>
              </div>
            </div>
          </div>

          {/* Registration Column (7/12) */}
          <div className="lg:col-span-7">
            <div className="bg-white/60 backdrop-blur-2xl p-10 lg:p-16 rounded-[4rem] border border-white shadow-[0_40px_100px_rgba(0,0,0,0.05)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            
              {/* Role Selection */}
              <div className="space-y-6">
                <h3 className="font-headline text-xl font-bold text-primary italic">I am a...</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setRole("parent")}
                    className={cn(
                      "group relative flex flex-col p-6 bg-white rounded-2xl text-left transition-all duration-300 shadow-sm border-2",
                      role === "parent" ? "border-primary ring-8 ring-primary/5" : "border-transparent hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "mb-4 w-12 h-12 flex items-center justify-center rounded-xl transition-colors shadow-inner",
                      role === "parent" ? "bg-primary text-white" : "bg-secondary-fixed text-on-secondary-fixed"
                    )}>
                      <MaterialIcon name="family_history" className="text-2xl" />
                    </div>
                    <span className="font-headline font-bold text-lg text-primary tracking-tight">Parent</span>
                    <span className="text-xs text-on-surface-variant font-medium opacity-60">Finding safe, professional care.</span>
                  </button>

                  <button 
                    onClick={() => setRole("caregiver")}
                    className={cn(
                      "group relative flex flex-col p-6 bg-white rounded-2xl text-left transition-all duration-300 shadow-sm border-2",
                      role === "caregiver" ? "border-primary ring-8 ring-primary/5" : "border-transparent hover:border-slate-200"
                    )}
                  >
                    <div className={cn(
                      "mb-4 w-12 h-12 flex items-center justify-center rounded-xl transition-colors shadow-inner",
                      role === "caregiver" ? "bg-primary text-white" : "bg-tertiary-fixed text-on-tertiary-fixed"
                    )}>
                      <MaterialIcon name="medical_services" className="text-2xl" />
                    </div>
                    <span className="font-headline font-bold text-lg text-primary tracking-tight">Caregiver</span>
                    <span className="text-xs text-on-surface-variant font-medium opacity-60">Providing trusted support.</span>
                  </button>
                </div>
              </div>

              {/* Form */}
              <form method="POST" onSubmit={handleSubmit} className="space-y-6 mt-8">
                <div className="space-y-2">
                  <label className="font-label text-xs font-black text-primary/40 px-1 uppercase tracking-widest">Full Name</label>
                  <input 
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white border border-outline-variant/15 rounded-xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium placeholder:text-slate-200 shadow-inner" 
                    placeholder="Jane Doe" 
                    type="text"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="font-label text-xs font-black text-primary/40 px-1 uppercase tracking-widest">Email</label>
                    <input 
                      required
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      className="w-full bg-white border border-outline-variant/15 rounded-xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium placeholder:text-slate-200 shadow-inner" 
                      placeholder="jane@example.com" 
                      type="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-xs font-black text-primary/40 px-1 uppercase tracking-widest">Password</label>
                    <input 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-outline-variant/15 rounded-xl py-4 px-5 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all font-medium placeholder:text-slate-200 shadow-inner" 
                      placeholder="••••••••" 
                      type="password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="font-label text-xs font-black text-primary/40 uppercase tracking-widest">Referral Code (Optional)</label>
                    {checkingCode && <span className="text-[9px] font-bold text-slate-400 animate-pulse uppercase">Verifying...</span>}
                    {!checkingCode && isCodeValid && <span className="text-[9px] font-bold text-green-500 uppercase flex items-center gap-1"><MaterialIcon name="check" className="text-xs" /> Code Applied</span>}
                    {!checkingCode && isCodeValid === false && <span className="text-[9px] font-bold text-red-400 uppercase">Invalid Code</span>}
                  </div>
                  <div className="relative">
                    <input 
                      value={referralCode}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setReferralCode(val);
                        validateCode(val);
                      }}
                      className={cn(
                        "w-full bg-white border rounded-xl py-4 px-5 transition-all font-black tracking-widest uppercase text-sm shadow-inner focus:outline-none focus:ring-4 ring-primary/5",
                        isCodeValid ? "border-green-500 text-green-700 bg-green-50/10" : "border-outline-variant/15 focus:border-primary/20 text-primary"
                      )}
                      placeholder="FRIEND-2024" 
                      type="text"
                    />
                    {isCodeValid && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                          <MaterialIcon name="verified" className="text-xl" fill />
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  disabled={loading}
                  type="submit"
                  className="w-full bg-primary text-white font-headline font-black py-5 rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all duration-300 uppercase tracking-widest text-[10px] mt-4 disabled:opacity-50"
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
                <p className="text-[10px] text-center text-on-surface-variant/60 font-medium px-4 leading-relaxed">
                  By creating an account, you agree to our <Link href="/terms" className="text-secondary font-bold hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-secondary font-bold hover:underline">Privacy Policy</Link>.
                </p>
              </form>

              <div className="space-y-6 pt-6 border-t border-slate-100 mt-6">
                <div className="relative flex items-center gap-4">
                  <div className="h-px flex-1 bg-slate-100"></div>
                  <span className="text-[10px] font-black text-on-surface-variant tracking-[0.2em] uppercase opacity-40">Or Continue With</span>
                  <div className="h-px flex-1 bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <button 
                    type="button"
                    onClick={signUpWithGoogle}
                    className="flex items-center justify-center gap-3 bg-white border border-outline-variant/10 py-4 rounded-xl hover:bg-slate-50 transition-all font-black text-[10px] text-primary uppercase tracking-widest shadow-sm"
                  >
                    <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzl_awn8TETYvPD_AIds-P1a8Vf-rM2Cvm9pAY0bT7ssIi6W_80DjKUSVTBgz3-NT-iEJgKuKZzPzoKneVa81CrBjbm_1wJVILIkz3mCvVANhEOyXOzRWtFUhq7MdGKcnNzyGMLel-ubBE5uSIsbDKesSC0OqVbO-B9q3XPNUYPVo1gksGcSVCmSiyuPA9poiE5ss2iNAOc65Ml91fYoastaHfsKrsHK6cGlcsSS8yih6pBLBhqb16JbsjvHBUSNeMCiWoaOhGvNo" className="w-5 h-5 grayscale opacity-50" alt="Google" />
                    Google
                  </button>
                </div>
                <p className="text-center text-sm font-medium text-on-surface-variant">
                  Already have an account? 
                  <Link href="/login" className="text-accent-red font-black hover:underline underline-offset-4 ml-1 italic tracking-tight">Sign in</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
