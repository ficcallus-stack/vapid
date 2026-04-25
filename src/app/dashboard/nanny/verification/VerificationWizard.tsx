"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, Lock, Fingerprint, 
  Camera, ArrowRight, ArrowLeft, Loader2, CheckCircle2,
  AlertCircle, CreditCard, UserCheck, Shield,
  Video, Info, Star, Smartphone, Eye, EyeOff, RotateCcw,
  ChevronDown
} from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { 
  uploadIdentityDocs, 
  submitBackgroundAuth, 
  submitReferences, 
  finalizeVerification 
} from "./actions";
import { useToast } from "@/components/Toast";
import "../profile/nannyverification.css";

export default function VerificationWizard({ initialData, user }: { initialData: any; user: any }) {
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(Math.min(initialData?.verification?.currentStep || 1, 4));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [hasConsented, setHasConsented] = useState(initialData?.verification?.backgroundAuth || false);

  // Form State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [dob, setDob] = useState(user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || "");
  const [docType, setDocType] = useState<"passport" | "id_card" | "dl">("id_card");
  
  // Track if documents are already on server
  const [front, setFront] = useState<File | null>(null);
  const [back, setBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(initialData?.verification?.selfieUrl || null);
  
  const [ssn, setSsn] = useState(initialData?.verification?.ssn || "");
  const [showSsn, setShowSsn] = useState(false);
  const [refs, setRefs] = useState(initialData?.verification?.references || [
    { name: "", email: "" },
    { name: "", email: "" }
  ]);

  // Force scroll to top on step change or loading state
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [currentStep, isSubmitting]);

  const steps = [
    { id: 1, label: "Identity", icon: <CreditCard size={18} />, title: "Verify Identity" },
    { id: 2, label: "Verification", icon: <Fingerprint size={18} />, title: "Security Check" },
    { id: 3, label: "References", icon: <UserCheck size={18} />, title: "Professional References" },
    { id: 4, label: "Review", icon: <ShieldCheck size={18} />, title: "Final Review" }
  ];

  const nextStep = () => {
    setCurrentStep((prev: number) => Math.min(prev + 1, 4));
  };
  const prevStep = () => {
    setCurrentStep((prev: number) => Math.max(prev - 1, 1));
  };

  const handleNextAction = async () => {
    setIsSubmitting(true);
    try {
      if (currentStep === 1) {
        const hasFront = front || initialData?.verification?.idFrontUrl;
        const hasBack = back || initialData?.verification?.idBackUrl;
        const hasSelfie = selfie || initialData?.verification?.selfieUrl;
        
        if (!fullName) return showToast("Please enter your full legal name.", "error");
        if (!dob) return showToast("Please enter your date of birth.", "error");
        if (!phoneNumber) return showToast("Please enter your phone number.", "error");
        if (!hasFront) return showToast(`Please upload the front of your ${docType === 'passport' ? 'passport' : 'ID'}.`, "error");
        if (docType !== 'passport' && !hasBack) return showToast("Please upload the back of your ID.", "error");
        if (!hasSelfie) return showToast("Please record your verification video.", "error");

        // Only upload if there's a NEW file
        const formData = new FormData();
        if (front) formData.append("front", front);
        if (back) formData.append("back", back);
        if (selfie) formData.append("selfie", selfie);
        formData.append("fullName", fullName);
        formData.append("dob", dob);
        formData.append("phoneNumber", phoneNumber);
        await uploadIdentityDocs(formData);
        setCurrentStep(2);
        showToast("Identity assets secured.", "success");
        return;
      } else if (currentStep === 2) {
        if (!hasConsented) return showToast("Please authorize the background check to proceed.", "error");
        if (ssn.length < 9) return showToast("Please provide your full 9-digit SSN for the background check.", "error");
        await submitBackgroundAuth(ssn);
        setCurrentStep(3);
      } else if (currentStep === 3) {
        if (refs.some((r: any) => !r.name || !r.email)) return showToast("Please provide both references.", "error");
        await submitReferences(JSON.stringify(refs));
        setCurrentStep(4);
      } else if (currentStep === 4) {
        await finalizeVerification();
        setCurrentStep(5);
        return;
      }
    } catch (err: any) {
      showToast(err.message || "Action Failed.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const trustScore = 250 + (currentStep > 1 ? 200 : 0) + (currentStep > 2 ? 300 : 0) + (currentStep > 3 ? 150 : 0);

  const calculateVerificationCompletion = () => {
    let score = 0;
    // Step 1: Identity (30%)
    if (fullName?.length > 3) score += 5;
    if (front || initialData?.verification?.idFrontUrl) score += 10;
    if (back || initialData?.verification?.idBackUrl) score += 10;
    if (selfie || initialData?.verification?.selfieUrl) score += 5;
    
    // Step 2: Background (20%)
    if (initialData?.verification?.backgroundAuth) score += 20;

    // Step 3: References (40%)
    const validRefs = (refs || []).filter((r: any) => r.name && r.email).length;
    score += Math.min(validRefs * 20, 40);

    // Step 4: Final Review (10%)
    if (currentStep >= 4) score += 10;

    return Math.min(score, 100);
  };

  if (currentStep === 5 && initialData?.verification?.status === 'pending') {
     return (
        <div className="nannyverification-body h-screen flex items-center justify-center p-6">
           <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="step-card text-center max-w-md w-full py-16">
              <Star size={64} className="text-primary mx-auto mb-8 animate-pulse" />
              <h1 className="text-4xl font-black italic tracking-tighter text-primary mb-4">Vetting Initiated</h1>
              <p className="text-on-surface-variant opacity-60 italic mb-10">Your dossier is being analyzed by the Kindred Secure Hub.</p>
              <button onClick={() => window.location.href = "/dashboard/nanny"} className="btn btn-primary w-full">Return Home</button>
           </motion.div>
        </div>
     );
  }

  return (
    <div className="nannyverification-body min-h-screen">
      <div className="app-container">
        {/* Progress Header */}
        <header className="header-progress">
          <div className="progress-info">
            <div>
              <span className="progress-title italic tracking-tighter">{steps[currentStep-1]?.title}.</span>
              <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 mt-1">Kindred Verification • {currentStep}/4</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest text-primary italic opacity-40">Verification Strength</span>
              <p className="text-xl font-black text-primary italic leading-none">{calculateVerificationCompletion()}%</p>
            </div>
          </div>
          <div className="progress-track">
            <motion.div 
              className="progress-fill" 
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / 4) * 100}%` }}
              transition={{ duration: 0.8, ease: "circOut" }}
            />
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${calculateVerificationCompletion()}%`, background: 'var(--secondary)', opacity: 0.3, transition: 'width 0.8s ease-out' }} />
          </div>
        </header>

        <main className="content-area">
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col items-center justify-center py-40 space-y-10"
              >
                <div className="relative">
                  <Loader2 size={80} className="animate-spin text-primary opacity-10" strokeWidth={1} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shield className="text-primary animate-pulse" size={32} />
                  </div>
                </div>
                <div className="text-center space-y-3">
                  <h2 className="text-3xl font-black italic tracking-tighter text-primary">
                    {currentStep === 1 && "Securing Identity Assets..."}
                    {currentStep === 2 && "Vaulting Security Details..."}
                    {currentStep === 3 && "Dispatching Reference Requests..."}
                    {currentStep === 4 && "Finalizing Vetting Dossier..."}
                  </h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/40 animate-pulse">
                    Connecting to Secure Dispatch Hub
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={currentStep}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.4 }}
              >
                {/* Step 1: Identity */}
                {currentStep === 1 && (
                  <div className="space-y-12">
                    <div className="editorial-section">
                      <h2 className="text-3xl font-black italic tracking-tighter text-primary">We need to verify who you are.</h2>
                      <p className="text-on-surface-variant opacity-60 italic text-sm mt-2">Verification starts with proof of identity.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-surface-container-low p-8 rounded-[3rem] border border-outline-variant/10 space-y-8">
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 block italic">1. Select Document Type</label>
                              <div className="grid grid-cols-3 gap-3">
                                {["id_card", "dl", "passport"].map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setDocType(t as any)}
                                    className={cn(
                                      "py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                                      docType === t 
                                        ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                                        : "bg-white text-on-surface-variant border-outline-variant/20 hover:border-primary/40"
                                    )}
                                  >
                                    {t === "id_card" && "ID Card"}
                                    {t === "dl" && "Driver's License"}
                                    {t === "passport" && "Passport"}
                                  </button>
                                ))}
                              </div>
                           </div>

                           <div>
                              <div className="flex justify-between items-center mb-4">
                                <label className="text-[10px] font-black uppercase tracking-widest text-primary italic">2. Identity Details</label>
                                <span className="text-[9px] font-black uppercase tracking-widest text-primary opacity-40">Profile Sync Active</span>
                              </div>
                              <div className="space-y-4">
                                <div className="space-y-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-4">Full Legal Name</span>
                                  <input 
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                    className="w-full bg-white/50 border border-outline-variant/10 p-4 rounded-2xl font-bold italic text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-4">Date of Birth</span>
                                    <input 
                                      type="date"
                                      value={dob}
                                      onChange={(e) => setDob(e.target.value)}
                                      className="w-full bg-white/50 border border-outline-variant/10 p-4 rounded-2xl font-bold text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-4">Phone Number</span>
                                    <input 
                                      type="tel"
                                      value={phoneNumber}
                                      onChange={(e) => setPhoneNumber(e.target.value)}
                                      placeholder="+1 (555) 000-0000"
                                      className="w-full bg-white/50 border border-outline-variant/10 p-4 rounded-2xl font-bold text-on-surface-variant focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                    />
                                  </div>
                                </div>
                              </div>
                           </div>
                        </div>

                        <div className="step-card bg-white editorial-shadow">
                          <div className="flex items-center gap-3 mb-8">
                            <Fingerprint size={20} className="text-primary" />
                            <h3 className="font-black italic tracking-tight uppercase text-xs tracking-widest text-primary">3. Scan {docType === 'passport' ? 'Passport' : 'ID'}</h3>
                          </div>
                          <div className={cn("grid gap-4 mb-8", docType === 'passport' ? "grid-cols-1" : "grid-cols-2")}>
                            <label className="asymmetric-radius h-48 bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors overflow-hidden relative">
                              {front ? <img src={URL.createObjectURL(front)} className="w-full h-full object-cover" /> : 
                               initialData?.verification?.idFrontUrl ? <img src={initialData.verification.idFrontUrl} className="w-full h-full object-cover opacity-60" /> : (
                                <div className="text-center p-6">
                                  <Camera size={24} className="text-primary/30 mx-auto mb-3" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 block mb-1">Upload {docType === 'passport' ? 'Main Data Page' : 'Front View'}</span>
                                  <p className="text-[8px] text-on-surface-variant/20 italic">Tap to open camera or gallery</p>
                                </div>
                              )}
                              <input type="file" hidden accept="image/*" onChange={(e) => setFront(e.target.files?.[0] || null)} />
                            </label>
                            
                            {docType !== 'passport' && (
                              <label className="asymmetric-radius h-48 bg-surface-container-low border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/40 transition-colors overflow-hidden relative">
                                {back ? <img src={URL.createObjectURL(back)} className="w-full h-full object-cover" /> : 
                                 initialData?.verification?.idBackUrl ? <img src={initialData.verification.idBackUrl} className="w-full h-full object-cover opacity-60" /> : (
                                  <div className="text-center p-6">
                                    <RotateCcw size={24} className="text-primary/30 mx-auto mb-3" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 block mb-1">Upload Back View</span>
                                    <p className="text-[8px] text-on-surface-variant/20 italic">Ensures secondary security keys are visible</p>
                                  </div>
                                )}
                                <input type="file" hidden accept="image/*" onChange={(e) => setBack(e.target.files?.[0] || null)} />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="step-card bg-primary text-white editorial-shadow overflow-hidden relative">
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                              <Video size={20} className="text-white" />
                              <h3 className="font-black italic tracking-tight uppercase text-xs tracking-widest">Video Check</h3>
                            </div>
                            {videoPreview ? (
                              <div className="space-y-4">
                                 <div className="asymmetric-radius overflow-hidden bg-black/40 aspect-video relative group border border-white/10 shadow-2xl">
                                    <video 
                                      key={videoPreview}
                                      src={`${videoPreview}#t=0.001`} 
                                      controls 
                                      playsInline
                                      preload="metadata"
                                      className="w-full h-full object-cover" 
                                    />
                                    <button 
                                       type="button"
                                       onClick={() => {
                                         setSelfie(null);
                                         setVideoPreview(null);
                                       }}
                                       className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 backdrop-blur-xl p-3 rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                                    >
                                       <RotateCcw size={16} />
                                    </button>
                                 </div>
                                 <button 
                                   type="button"
                                   onClick={() => {
                                     setSelfie(null);
                                     setVideoPreview(null);
                                   }}
                                   className="btn bg-white/20 hover:bg-white/30 text-white w-full flex items-center justify-center gap-3"
                                 >
                                   <RotateCcw size={14} /> Retake Verification Video
                                 </button>
                              </div>
                            ) : (
                              <label className="btn btn-outline border-white/20 text-white w-full cursor-pointer hover:bg-white/10 relative overflow-hidden">
                                <Camera size={16} /> Start Recording
                                <input 
                                  type="file" 
                                  hidden 
                                  accept="video/*" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const localUrl = URL.createObjectURL(file);
                                      setVideoPreview(localUrl);
                                      
                                      const videoElement = document.createElement('video');
                                      videoElement.preload = 'metadata';
                                      const validationTimeout = setTimeout(() => {
                                         setSelfie(file);
                                      }, 2000);

                                      videoElement.onloadedmetadata = () => {
                                         clearTimeout(validationTimeout);
                                         if (videoElement.duration < 3 || videoElement.duration > 60) {
                                            showToast("Verification video should be between 3 and 60 seconds.", "error");
                                            setSelfie(null);
                                            setVideoPreview(null);
                                         } else {
                                            setSelfie(file);
                                         }
                                      };
                                      videoElement.src = localUrl;
                                    }
                                  }} 
                                />
                              </label>
                            )}
                          </div>
                          <Shield className="absolute -bottom-8 -right-8 text-[120px] opacity-[0.05]" fill="currentColor" />
                        </div>
                        <div className="px-6 bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
                           <div className="flex items-center gap-3 text-primary mb-2">
                             <Fingerprint size={16} />
                             <span className="text-[10px] font-black uppercase tracking-widest italic">Why a video?</span>
                           </div>
                           <p className="text-[10px] text-on-surface-variant/60 italic leading-relaxed">
                             A quick video confirms you are the same person on the ID. This is an important step to keep our community safe from fraud.
                           </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-12 border-t border-outline-variant/10">
                       <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100 flex items-start gap-6">
                          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl shadow-emerald-500/20">
                             <Lock size={20} fill="currentColor" />
                          </div>
                          <div>
                             <h4 className="text-[11px] font-black uppercase tracking-widest text-emerald-900 italic mb-2">Your Privacy</h4>
                             <p className="text-[10px] text-emerald-800/60 italic leading-relaxed">
                               Your personal details (SSN, ID Photos, Birth Date) are kept highly secure. They are never shown to families or sold to anyone. Your privacy is our priority.
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Verification */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="editorial-section">
                      <h2 className="text-3xl font-black italic tracking-tighter text-primary">Security Check.</h2>
                      <p className="text-on-surface-variant opacity-60 italic text-sm mt-2">Your SSN is encrypted and deleted after we verify your background.</p>
                    </div>

                    <div className="step-card editorial-shadow p-10 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mb-8">
                        <Lock size={32} />
                      </div>
                      <div className="form-group w-full max-w-[340px]">
                        <label className="text-center mb-4">Full Social Security Number</label>
                        <div className="relative flex">
                          <input 
                            type={showSsn ? "text" : "password"} 
                            maxLength={9} 
                            value={ssn}
                            onChange={(e) => setSsn(e.target.value.replace(/\D/g, ""))}
                            className="text-center text-3xl tracking-[0.4em] font-black bg-surface-container-low border-none h-20 rounded-l-3xl w-full focus:ring-4 focus:ring-primary/10 transition-all pr-4"
                            placeholder={showSsn ? "000000000" : "•••••••••"}
                          />
                          <button 
                            type="button"
                            onClick={() => setShowSsn(!showSsn)}
                            className="w-20 h-20 bg-surface-container-low border-l border-outline-variant/10 rounded-r-3xl flex items-center justify-center text-on-surface-variant/40 hover:text-primary transition-colors shrink-0"
                          >
                            {showSsn ? <EyeOff size={24} /> : <Eye size={24} />}
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-12 w-full max-w-[400px]">
                        <label className="flex items-start gap-4 cursor-pointer group text-left">
                          <div className="relative flex items-center justify-center mt-1">
                            <input 
                              type="checkbox" 
                              checked={hasConsented}
                              onChange={(e) => setHasConsented(e.target.checked)}
                              className="peer h-6 w-6 appearance-none rounded-lg border-2 border-outline-variant transition-all checked:bg-primary checked:border-primary cursor-pointer"
                            />
                            <MaterialIcon name="check" className="absolute text-white text-xs opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-black italic text-primary group-hover:opacity-80 transition-opacity block mb-1">Authorization & Consent</span>
                            <p className="text-[10px] text-on-surface-variant/60 italic leading-relaxed">
                              I authorize Kindred to conduct a professional background check. I understand my SSN is used solely for verification via secure third-party providers.
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="mt-12 flex flex-col items-center gap-4">
                         <div className="flex items-center gap-2 text-primary/40">
                            <Shield size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest italic">Highly Secure</span>
                         </div>
                         <p className="text-[10px] text-on-surface-variant/40 italic max-w-[280px]">
                           We need your full SSN for a standard background check. This info is sent through a secure, encrypted connection and is never stored permanently.
                         </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Social Proof */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="editorial-section">
                      <h2 className="text-3xl font-black italic tracking-tighter text-primary">Professional References.</h2>
                      <p className="text-on-surface-variant opacity-60 italic text-sm mt-2">We'll reach out to your previous employers to confirm your experience.</p>
                    </div>

                    {refs.map((ref: any, i: number) => (
                      <div key={i} className="step-card editorial-shadow space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-black flex items-center justify-center italic">{i+1}</div>
                          <h3 className="font-black italic text-xs uppercase tracking-widest text-primary">Reference Details</h3>
                        </div>
                        <div className="form-group">
                          <label>Contact Full Name</label>
                          <input 
                            value={ref.name} 
                            onChange={(e) => {
                              const newRefs = [...refs];
                              newRefs[i].name = e.target.value;
                              setRefs(newRefs);
                            }}
                            className="bg-surface-container-low border-none font-bold" 
                            placeholder="Former Employer" 
                          />
                        </div>
                        <div className="form-group">
                          <label>Direct Email</label>
                          <input 
                            type="email" 
                            value={ref.email} 
                            onChange={(e) => {
                              const newRefs = [...refs];
                              newRefs[i].email = e.target.value;
                              setRefs(newRefs);
                            }}
                            className="bg-surface-container-low border-none font-bold" 
                            placeholder="verification@domain.com" 
                          />
                        </div>
                      </div>
                    ))}
                    
                    <div className="banner-primary opacity-80 py-4 px-6 rounded-3xl flex items-center gap-3">
                      <Info size={16} className="shrink-0" />
                      <p className="text-[10px] font-medium italic">We'll send a secure link to your references.</p>
                    </div>
                  </div>
                )}

                {/* Step 4: Final Review */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="editorial-section text-center">
                      <ShieldCheck size={48} className="text-primary mx-auto mb-6" />
                      <h2 className="text-4xl font-black italic tracking-tighter text-primary">Review & Submit.</h2>
                      <p className="text-on-surface-variant opacity-60 italic text-sm mt-2">Check your details one last time before sending.</p>
                    </div>

                    <div className="step-card editorial-shadow p-0 overflow-hidden">
                      <div className="p-6 bg-primary text-white flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Lock size={16} />
                          <span className="text-[10px] font-black uppercase tracking-widest italic">Security Status</span>
                        </div>
                        <span className="text-[10px] font-black italic">Ready</span>
                      </div>
                      <div className="p-8 space-y-4">
                         {[
                           { 
                             label: "Identity Details", 
                             status: (front || initialData?.verification?.idFrontUrl) && (back || initialData?.verification?.idBackUrl) ? "Uploaded" : "Missing", 
                             icon: <CheckCircle2 size={16} className={(front || initialData?.verification?.idFrontUrl) && (back || initialData?.verification?.idBackUrl) ? "text-green-600" : "text-on-surface-variant/20"} />,
                             details: [
                               { label: "Front ID Scan", val: front || initialData?.verification?.idFrontUrl ? "Provided" : "Missing" },
                               { label: "Back ID Scan", val: back || initialData?.verification?.idBackUrl ? "Provided" : "Missing" },
                               { label: "Identity Video", val: selfie || initialData?.verification?.selfieUrl ? "Provided" : "Missing" }
                             ]
                           },
                           { 
                             label: "Background Authorization", 
                             status: ssn.length === 9 || initialData?.verification?.backgroundAuth ? "Provided" : "Missing", 
                             icon: <CheckCircle2 size={16} className={ssn.length === 9 || initialData?.verification?.backgroundAuth ? "text-green-600" : "text-on-surface-variant/20"} />,
                             details: [
                               { label: "9-Digit Identifier", val: ssn.length === 9 || initialData?.verification?.ssn ? "Provided" : "Missing" },
                               { label: "Background Consent", val: initialData?.verification?.backgroundAuth ? "Signed" : "Ready" }
                             ]
                           },
                           { 
                             label: "Professional References", 
                             status: refs.every((r: any) => r.email) ? "Complete" : "Incomplete", 
                             icon: <CheckCircle2 size={16} className={refs.every((r: any) => r.email) ? "text-green-600" : "text-on-surface-variant/20"} />,
                             details: refs.map((r: any, i: number) => ({
                               label: `Reference ${i+1}`,
                               val: r.name || "Pending"
                             }))
                           }
                         ].map((item, idx) => {
                           const isExpanded = expandedReview === idx;
                           return (
                            <div key={idx} className="border-b border-outline-variant/10 last:border-none pb-4">
                              <button 
                                onClick={() => setExpandedReview(isExpanded ? null : idx)}
                                className="w-full flex justify-between items-center py-2 hover:opacity-80 transition-opacity"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="opacity-100">{item.icon}</div>
                                  <span className="text-xs font-black italic text-primary">{item.label}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <span className="text-[10px] font-bold text-on-surface-variant opacity-40 italic">{item.status}</span>
                                  <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                                    <ChevronDown size={14} className="text-on-surface-variant/20" />
                                  </motion.div>
                                </div>
                              </button>
                              
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pt-4 pb-2 space-y-3 pl-8">
                                      {item.details.map((detail: any, dIdx: number) => (
                                        <div key={dIdx} className="flex justify-between items-center">
                                          <span className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{detail.label}</span>
                                          <span className={cn("text-[10px] font-black italic", detail.val === "Missing" ? "text-error" : "text-primary")}>{detail.val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                           );
                         })}
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10">
                      <p className="text-[10px] text-on-surface-variant/40 italic text-center">
                        Once submitted, we'll start our review process. This typically takes about 48 hours.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sticky Footer */}
        {!isSubmitting && (
          <footer className="nav-footer">
            <button className="btn btn-outline" onClick={prevStep}>
              <ArrowLeft size={18} /> {currentStep === 1 ? "Cancel" : "Back"}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleNextAction}
            >
              {currentStep === 4 ? "Submit" : "Continue"} <ArrowRight size={18} />
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
