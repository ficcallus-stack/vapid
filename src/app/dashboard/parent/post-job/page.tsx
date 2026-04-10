"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MaterialIcon } from "@/components/MaterialIcon";
import Step1 from "@/components/post-job/Step1";
import Step2 from "@/components/post-job/Step2";
import Step3 from "@/components/post-job/Step3";
import Step4 from "@/components/post-job/Step4";
import Step5 from "@/components/post-job/Step5";
import { createJob, getLatestJobDraft, upsertJobDraft, deleteJobDraft } from "./actions";
import { getChildren } from "../children/actions";
import { getParentProfile } from "../settings/actions";
import { useToast } from "@/components/Toast";
import confetti from "canvas-confetti";

export default function PostJobPage() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableChildren, setAvailableChildren] = useState<any[]>([]);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    childCount: 1,
    location: "",
    duration: "",
    startDate: "",
    schedule: {} as Record<string, boolean>,
    certs: { cpr: false, first_aid: false },
    duties: "",
    minRate: 20,
    maxRate: 30,
    description: "",
    isFeatured: false,
    isBoosted: false,
    hiringType: "hourly",
    retainerBudget: 1200,
    latitude: 0,
    longitude: 0,
  });
  const [hasDraft, setHasDraft] = useState(false);
  const router = useRouter();

  // 1. Real-time LocalStorage Persistence
  useEffect(() => {
    if (formData.location || formData.description || Object.keys(formData.schedule || {}).length > 0) {
      localStorage.setItem("kindred_job_draft", JSON.stringify({ 
        ...formData, 
        step,
        lastUpdated: new Date().toISOString() 
      }));
    }
  }, [formData, step]);

  // 2. Initialize and Merge Data
  useEffect(() => {
    Promise.all([
      getChildren(),
      getParentProfile(),
      getLatestJobDraft()
    ]).then(([children, profile, draft]) => {
      setAvailableChildren(children);

      // Priority 1: LocalStorage (Fastest/Latest)
      const localDraftRaw = localStorage.getItem("kindred_job_draft");
      if (localDraftRaw) {
        try {
          const localDraft = JSON.parse(localDraftRaw);
          setFormData(prev => ({ ...prev, ...localDraft }));
          setStep(localDraft.step || 1);
          setHasDraft(true);
          showToast("Resumed your recent progress!", "success");
          return; // Skip cloud draft if local exists
        } catch (e) {
          console.error("Local draft error:", e);
        }
      }
      
      // Priority 2: Cloud Draft
      if (draft) {
        setFormData(prev => ({
          ...prev,
          ...(draft as any),
          retainerBudget: (draft as any).retainerBudget ? (draft as any).retainerBudget / 100 : prev.retainerBudget,
          childCount: (draft as any).childCount || children.length || prev.childCount,
        }));
        setHasDraft(true);
      } else if (profile || children.length > 0) {
        setFormData(prev => ({
          ...prev,
          location: profile?.location || prev.location,
          childCount: children.length > 0 ? children.length : prev.childCount,
          selectedChildrenIds: children.map((c: any) => c.id)
        }));
      }
    }).catch(console.error);
  }, []);

  // Save to DB on step change (Background sync)
  useEffect(() => {
    if (step > 1 && (formData.location || formData.description)) {
      const timer = setTimeout(() => {
        upsertJobDraft(formData).catch(console.error);
      }, 5000); // Throttled longer since local is primary
      return () => clearTimeout(timer);
    }
  }, [formData, step]);

  const handleResumeDraft = () => {
    setHasDraft(false); // Already resumed in useEffect
  };

  const handleDiscardDraft = async () => {
    localStorage.removeItem("kindred_job_draft");
    await deleteJobDraft();
    setHasDraft(false);
    showToast("Draft discarded.", "info");
    window.location.reload(); 
  };

  const handleSaveAsDraft = async () => {
    localStorage.setItem("kindred_job_draft", JSON.stringify({ ...formData, step }));
    await upsertJobDraft(formData);
    showToast("Progress saved!", "success");
  };

  const updateData = (newData: any) => {
    setFormData((prev) => ({ ...prev, ...newData }));
  };

  const canGoNext = () => {
    if (step === 1) {
      const hasChildren = (formData as any).selectedChildrenIds?.length > 0 || formData.childCount > 0;
      return !!formData.location && !!formData.duration && !!formData.startDate && hasChildren;
    }
    if (step === 2) {
      if (formData.hiringType === "retainer") {
        return !!formData.retainerBudget && formData.retainerBudget >= 300;
      }
      const hasSchedule = Object.values(formData.schedule || {}).some(v => v);
      const ratesValid = Number(formData.maxRate) >= Number(formData.minRate);
      return hasSchedule && ratesValid;
    }
    if (step === 3) return !!formData.description && formData.description.length >= 20; 
    if (step === 4) return !!(formData as any).stripePaymentIntentId;
    return true;
  };

  const nextStep = (skipCheck = false) => {
    if (!skipCheck) {
      if (step === 1) {
        const hasChildren = (formData as any).selectedChildrenIds?.length > 0 || formData.childCount > 0;
        if (!hasChildren) return showToast("Please select or specify the number of children", "error");
        if (!formData.location) return showToast("Please enter a location/zip code", "error");
        if (!formData.duration) return showToast("Please select a job duration", "error");
        if (!formData.startDate) return showToast("Please select a start date", "error");
      }
      if (step === 2) {
        if (formData.hiringType === "retainer") {
           if (!formData.retainerBudget || formData.retainerBudget < 300) {
              return showToast("Minimum weekly retainer is $300", "error");
           }
        } else {
           if (!Object.values(formData.schedule || {}).some(v => v)) {
             return showToast("Please select at least one time slot in the schedule", "error");
           }
           if (Number(formData.maxRate) < Number(formData.minRate)) {
             return showToast("Max rate must be greater than or equal to min rate", "error");
           }
        }
      }
      if (step === 3 && (!formData.description || formData.description.length < 20)) {
        return showToast("Please provide a job description (at least 20 characters)", "error");
      }

      if (!canGoNext()) {
        showToast("Please complete all required fields on this step", "error");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 5));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const goToStep = (s: number) => {
    if (s < step) setStep(s);
  };

  const handleSubmit = async () => {
    if (!canGoNext()) return;
    setIsSubmitting(true);
    try {
      await createJob(formData as any);
      
      // Celebration!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#f59e0b", "#10b981", "#ef4444"]
      });

      await deleteJobDraft(); // Clear draft on success
      showToast("Job posted successfully!", "success");
      
      // Deliberate delay for confetti satisfaction
      setTimeout(() => {
        router.push("/dashboard/parent");
      }, 2000);
    } catch (error: any) {
      console.error("Failed to create job:", error);
      showToast(error.message || "Failed to post job. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    { title: "Family Details", subtitle: "Job Details", icon: "edit_note" },
    { title: "Define your care schedule", subtitle: "Schedule", icon: "calendar_today" },
    { title: "Requirements", subtitle: "Requirements", icon: "verified_user" },
    { title: "Secure Payment & Escrow", subtitle: "Payment", icon: "payments" },
    { title: "Review & Finalize", subtitle: "Review", icon: "visibility" },
  ];

  return (
    <div className="bg-surface font-body text-on-surface min-h-screen">
      <div className={cn("min-h-screen flex", step === 5 ? "w-full" : "max-w-7xl mx-auto")}>
        {/* Progress Sidebar */}
        <aside className="hidden md:flex flex-col pt-12 pb-24 h-[calc(100vh-64px)] w-64 fixed left-0 top-16 bg-slate-50/50 border-r border-outline-variant/10 overflow-y-auto">
          <div className="px-6 mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1 font-label">New Job Posting</h2>
            <p className="text-sm font-bold text-secondary font-headline">Step {step} of 5</p>
          </div>
          <nav className="flex-1 pr-4">
            {STEPS.map((s, i) => (
              <div
                key={i}
                onClick={() => goToStep(i + 1)}
                className={cn(
                  "flex items-center gap-3 py-3 px-6 transition-all rounded-r-full cursor-pointer",
                  step === i + 1
                    ? "text-primary font-bold bg-white shadow-sm"
                    : i + 1 < step
                    ? "text-primary/60 hover:text-primary"
                    : "text-slate-400 pointer-events-none"
                )}
              >
                <MaterialIcon name={s.icon} fill={step === i + 1} />
                <span className="font-label font-bold text-sm">{s.subtitle}</span>
              </div>
            ))}
          </nav>
          <div className="mt-8 px-6 pb-20"> {/* Increased padding to avoid footer overlap */}
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col gap-2">
              <MaterialIcon name="shield_locked" className="text-emerald-600 text-2xl font-fill" fill />
              <p className="text-xs font-bold text-emerald-900 leading-relaxed">
                <strong className="block mb-1 font-black uppercase tracking-widest text-[10px]">Privacy Protected</strong>
                Only background-verified nannies will have access to your job details and location.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn("flex-1 pt-12 pb-20 px-6 md:px-12", step < 4 ? "md:ml-64" : "md:ml-64")}>
          <div className={cn(step === 5 ? "w-full" : "max-w-7xl mx-auto")}>
            {/* Resume Draft Banner */}
            {hasDraft && step === 1 && (
              <div className="mb-8 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <MaterialIcon name="history" className="text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary font-headline">Resume your progress?</h4>
                    <p className="text-xs text-on-surface-variant font-medium">We found an unfinished job post from your last visit.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleDiscardDraft} className="px-4 py-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-colors">Discard</button>
                  <button onClick={handleResumeDraft} className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold shadow-md shadow-primary/10 active:scale-95 transition-all">Resume</button>
                </div>
              </div>
            )}
            {/* Header Section (only for steps 1-4) */}
            {step < 5 && (
              <header className="mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                  <div className="space-y-1">
                    <span className="text-secondary font-bold tracking-[0.2em] uppercase text-[10px] font-label">Job Wizard</span>
                    <h1 className="text-4xl font-extrabold font-headline tracking-tight text-primary">
                      {STEPS[step - 1].title}
                    </h1>
                    {/* Privacy Notice for Mobile */}
                    <div className="md:hidden mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[11px] font-bold">
                      <MaterialIcon name="shield_locked" className="text-sm font-fill" fill />
                      Privacy Protected: Verified nannies only.
                    </div>
                  </div>
                  <div className="w-full md:w-80">
                    <div className="flex justify-end text-[11px] font-bold text-primary mb-2 uppercase tracking-tight">
                      <span className="font-headline">Step {step} of 5: {STEPS[step - 1].subtitle}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden shadow-inner flex justify-end">
                      <div
                        className="h-full bg-primary transition-all duration-700 ease-out rounded-full"
                        style={{ width: `${step * 20}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </header>
            )}

            {/* Step Content */}
            <div className="pb-32">
              {step === 1 && <Step1 availableChildren={availableChildren} data={formData} updateData={updateData} onNext={nextStep} onCancel={() => router.push("/dashboard/parent")} />}
              {step === 2 && <Step2 data={formData} updateData={updateData} onNext={nextStep} onBack={prevStep} />}
              {step === 3 && <Step3 data={formData} updateData={updateData} onNext={nextStep} onBack={prevStep} />}
              {step === 4 && <Step4 data={formData} updateData={updateData} onNext={(id) => { updateData({ stripePaymentIntentId: id }); nextStep(true); }} onBack={prevStep} />}
              {step === 5 && <Step5 data={formData} availableChildren={availableChildren} onEdit={goToStep} onBack={prevStep} onSubmit={handleSubmit} />}
            </div>
          </div>
        </main>
      </div>

      {/* Persistent Navigation Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-outline-variant/10 z-50 py-4 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button
              onClick={prevStep}
              disabled={step === 1 || isSubmitting}
              className={cn(
                "flex items-center gap-2 font-headline font-bold text-sm transition-all active:scale-95",
                (step === 1 || isSubmitting) ? "text-slate-300 pointer-events-none" : "text-primary hover:translate-x-[-4px]"
              )}
            >
              <MaterialIcon name="arrow_back" className="text-lg" />
              Back
            </button>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
              disabled={isSubmitting}
              onClick={handleSaveAsDraft}
              className="text-primary font-headline font-bold text-sm hover:opacity-70 transition-opacity disabled:opacity-30"
            >
              Save as Draft
            </button>
            <button
              disabled={isSubmitting || !canGoNext()}
              onClick={step === 5 ? handleSubmit : () => nextStep()}
              className="bg-primary text-on-primary px-10 py-3.5 rounded-xl font-headline font-extrabold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
            >
              {isSubmitting ? "Processing..." : step === 5 ? "Post Job Now" : "Next Step"}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
