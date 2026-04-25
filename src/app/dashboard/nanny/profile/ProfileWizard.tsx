"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, Upload, Lock, MapPin, Plus, Users, Video, 
  GraduationCap, Car, PlusCircle, X, History, Award, AlertCircle, Baby, Smile, BookOpen, Apple, Waves, 
  MessageCircle, Check, Loader2, Info, Camera, Shield, Verified, Dog, Cat, CheckSquare, ClipboardCheck,
  BabyIcon, UserCheck, School, Star, RefreshCw, Radio, ShieldAlert, Search
} from 'lucide-react';
import { 
  updateNannyProfile as saveProfessionalProfile, 
  uploadProfilePhotos,
  uploadAvatar,
  uploadVideo
} from "./actions";
import { useToast } from "@/components/Toast";
import { Link } from "lucide-react";
import "./nannyverification.css";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function ProfileWizard({ initialData }: { initialData: any }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [uploading, setUploading] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [xhrRef, setXhrRef] = useState<XMLHttpRequest | null>(null);
  const [locationSearch, setLocationSearch] = useState(initialData?.location || '');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState(initialData || {
    fullName: '', bio: '', hourlyRate: '35', weeklyRate: '1200', profileImageUrl: '',
    experienceYears: 0, education: '', detailedExperience: '', coreSkills: [], specializations: [],
    location: '', latitude: null, longitude: null, maxTravelDistance: 25, hasCar: false, carDescription: '', logistics: [],
    photos: Array(5).fill(null), videoUrl: ''
  });

  const SKILLS = [
    { name: "CPR/First Aid", icon: <Shield size={14} /> },
    { name: "Newborns", icon: null },
    { name: "Montessori", icon: <Check size={14} /> },
    { name: "Reggio Emilia", icon: null },
    { name: "Special Needs", icon: null },
    { name: "Bilingual", icon: null },
    { name: "Sleep Training", icon: <Check size={14} /> },
    { name: "Potty Training", icon: <Check size={14} /> },
    { name: "Culinary Prep", icon: null },
    { name: "Water Safety", icon: null },
    { name: "Sign Language", icon: null },
    { name: "Homeschooling", icon: null }
  ];

  const AGE_SPECIALTIES = [
    { label: "Newborns (0-3m)", icon: <Baby size={24} /> },
    { label: "Infants (3-12m)", icon: <BabyIcon size={24} /> },
    { label: "Toddlers (1-3y)", icon: <Smile size={24} /> },
    { label: "Preschool (3-5y)", icon: <School size={24} /> },
    { label: "School Age (5+)", icon: <School size={24} /> }
  ];

  const BENCHMARKS = [
    { name: "Native English", icon: null },
    { name: "Fluent Spanish", icon: null },
    { name: "Bilingual", icon: null },
    { name: "ASL Basics", icon: null },
    { name: "Dog Friendly", icon: <PlusCircle size={14} /> },
    { name: "Cat Friendly", icon: <PlusCircle size={14} /> },
    { name: "No Allergies", icon: <PlusCircle size={14} /> },
    { name: "Clean DMV Record", icon: <PlusCircle size={14} /> }
  ];

  const steps = [
    { title: 'Your Profile', desc: 'Tell families about yourself.' },
    { title: 'Experience & Skills', desc: 'Showcase your professional background.' },
    { title: 'Location & Travel', desc: 'Where and how you can work.' },
    { title: 'Photos & Video', desc: 'A first look for families.' }
  ];

  const updateField = (field: string, value: any) => setFormData((prev: any) => ({ ...prev, [field]: value }));
  
  const toggleItem = (field: string, item: string) => {
    setFormData((prev: any) => {
      const current = prev[field] || [];
      const updated = current.includes(item) ? current.filter((i: string) => i !== item) : [...current, item];
      return { ...prev, [field]: updated };
    });
  };

  const handleLocationSearch = async (query: string) => {
    setLocationSearch(query);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      // ZIP-FIX: Simplify types and add 'postcode' as a primary type
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=us&types=postcode,address,place&proximity=ip&autocomplete=true`);
      const data = await res.json();
      setSuggestions(data.features || []);
    } catch (err) {
      console.error("Mapbox search failed", err);
    }
  };

  const selectLocation = (feature: any) => {
    const [lng, lat] = feature.center;
    updateField('location', feature.place_name);
    updateField('latitude', lat);
    updateField('longitude', lng);
    setLocationSearch(feature.place_name);
    setSuggestions([]);
  };

  const handleFileUpload = async (e: any, type: string, index: number | null = null) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    // Immediate Local Preview for Video
    if (type === 'video') {
       setError(null); // Clear previous errors
       const localUrl = URL.createObjectURL(file);
       setUploadStatus("Analyzing video...");
       
       // Validation Step: Check Duration
       const videoElement = document.createElement('video');
       videoElement.preload = 'metadata';

       // Timeout for metadata load
       const timeoutId = setTimeout(() => {
          if (!videoElement.duration) {
             setError("Video analysis timed out. Your file might be in an unsupported format.");
             setUploadStatus("");
             setUploading(null);
          }
       }, 10000);

       videoElement.onloadedmetadata = async () => {
          clearTimeout(timeoutId);
          const duration = videoElement.duration;
          
          if (duration < 15) {
             setError("Your intro video is too short. It must be at least 15 seconds long.");
             setUploadStatus("");
             return;
          }

          if (duration > 60) {
             setError("Your intro video is too long. Please keep it under 60 seconds.");
             setUploadStatus("");
             return;
          }

          // Update preview ONLY if duration is valid
          updateField('videoUrl', localUrl);

          // Start Upload via XHR for progress
          setUploading('video');
          setUploadStatus("Uploading...");
          setProgress(0);

          const xhr = new XMLHttpRequest();
          setXhrRef(xhr);

          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              const p = Math.round((event.loaded * 100) / event.total);
              setProgress(p);
            }
          });

          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const response = JSON.parse(xhr.responseText);
              updateField('videoUrl', response.url);
              setUploadStatus("Done!");
              setTimeout(() => setUploadStatus(""), 2000);
            } else {
              setError("Upload failed. The file might be too large or the connection was lost.");
            }
            setUploading(null);
            setXhrRef(null);
          });

          xhr.addEventListener("error", () => {
            setError("Network error. Please check your connection and try again.");
            setUploading(null);
            setXhrRef(null);
          });

          xhr.open("POST", "/api/upload/video");
          const uploadData = new FormData();
          uploadData.append("file", file);
          xhr.send(uploadData);
       };
       videoElement.onerror = () => {
          setError("This file is not a valid video. Please record a new one.");
          setUploadStatus("");
       };
       videoElement.src = localUrl;
       
       // Reset input value so same file can be re-selected if needed
       e.target.value = "";
       return;
    }

    setUploading(type === 'profile' ? 'profile' : index);
    
    try {
       const uploadData = new FormData();
       
    // Bulk Image Upload for Portfolio
    if (type === 'portfolio') {
       const files = Array.from(e.target.files || []);
       if (files.length === 0) return;

       const existingCount = (formData.photos || []).filter((p: any) => p !== null).length;
       const remainingSlots = 5 - existingCount;

       if (files.length > remainingSlots) {
          setError(`You can only add ${remainingSlots} more photos. You currently have ${existingCount}/5 used.`);
          return;
       }

       setUploading('portfolio_bulk');
       setUploadStatus(`Uploading ${files.length} photos...`);

       try {
          const uploadData = new FormData();
          files.forEach((f: any) => uploadData.append("photos", f));
          
          // SPEED-FIX: Use API route instead of Server Action for 5x faster upload
          const res = await fetch('/api/upload/photos', {
            method: 'POST',
            body: uploadData
          });
          
          if (!res.ok) throw new Error("Upload failed");
          const result = await res.json();
          
          // Merge new URLs into available slots
          const newPhotos = [...(formData.photos || [])];
          let fileIdx = 0;
          for (let i = 0; i < 5; i++) {
             if (!newPhotos[i] && fileIdx < result.urls.length) {
                newPhotos[i] = result.urls[fileIdx];
                fileIdx++;
             }
          }
          updateField('photos', newPhotos);
          setUploadStatus("Photos added!");
          setTimeout(() => setUploadStatus(""), 2000);
       } catch (err: any) {
          showToast(err.message || "Failed to upload photos.", "error");
       } finally {
          setUploading(null);
       }
       e.target.value = "";
       return;
    }

    if (type === 'profile') {
       const uploadData = new FormData();
       uploadData.append("file", file);
       const result: any = await uploadAvatar(uploadData);
       updateField('profileImageUrl', result?.url);
    }
    } catch (err: any) { 
      showToast(err.message || "Upload failed. Please check your connection.", "error");
    } finally { 
      setUploading(null); 
    }
  };

  const calculateCompletion = () => {
    let score = 0;
    if (formData.fullName?.length > 3) score += 10;
    if (formData.bio?.length >= 250) score += 20;
    if (formData.hourlyRate) score += 10;
    if (formData.experienceYears > 0) score += 5;
    if (formData.detailedExperience?.length >= 250) score += 15;
    if (formData.location) score += 10;
    if (formData.videoUrl) score += 15;
    if (formData.photos?.filter((p: any) => p !== null).length >= 1) score += 15;
    return Math.min(score, 100);
  };

  const handleFinalSubmit = async () => {
    if (step === 0) {
      if (!formData.fullName) return showToast("Full name is required", "error");
      if (formData.bio.length < 250) return showToast(`Bio must be at least 250 characters (current: ${formData.bio.length})`, "error");
    }
    if (step === 1) {
      if (formData.detailedExperience.length < 250) return showToast(`Experience detail must be at least 250 characters (current: ${formData.detailedExperience.length})`, "error");
    }
    if (step === 2) {
      if (!formData.location) return showToast("Please select your primary location", "error");
    }
    if (step === 3 && !formData.videoUrl) {
      showToast("A video intro is required to complete your profile.", "error");
      return;
    }
    setIsVerifying(true);
    try {
      await saveProfessionalProfile(formData);
      showToast("Profile checkpoint saved.", "success");
      setStep(step + 1);
    } catch (err: any) { 
      showToast(err.message || "Something went wrong saving your profile.", "error");
      setIsVerifying(false); 
    }
  };

  const handleNext = () => {
    if (step === 3) handleFinalSubmit();
    else {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="nannyverification-body">
    <div className="app-container">
      {step < 4 && (
        <header className="header-progress">
          <div className="progress-info">
            <div>
              <span className="progress-title">{steps[step].title}</span>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-variant)' }}>Step {step + 1} of 4</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.625rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.1em' }}>Profile Strength</span>
              <p style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary)', fontStyle: 'italic', lineHeight: 1 }}>{calculateCompletion()}%</p>
            </div>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${((step + 1) / 4) * 100}%` }} />
            <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${calculateCompletion()}%`, background: 'var(--secondary)', opacity: 0.3, transition: 'width 0.8s ease-out' }} />
          </div>
        </header>
      )}

      <main className="content-area">
        <AnimatePresence mode="wait">
          {step === 4 ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="step-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
              <Star size={64} style={{ color: 'var(--primary)', marginBottom: '1.5rem', marginInline: 'auto' }} />
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Profile Saved</h2>
              <p style={{ color: 'var(--on-surface-variant)', marginBottom: '3rem' }}>Your professional profile is ready. You can now start your identity verification.</p>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.location.href = "/dashboard/nanny/verification"}>Continue to Verification</button>
            </motion.div>
          ) : isVerifying ? (
            <div style={{ textAlign: 'center', marginTop: '6rem' }}><Loader2 size={80} className="animate-spin mx-auto text-primary mb-6" /><h2>Saving your profile...</h2></div>
          ) : (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="editorial-section">
                <h2 style={{ fontSize: '2.25rem', marginBottom: '0.5rem', color: 'var(--primary)', fontStyle: 'italic', letterSpacing: '-0.03em' }}>{steps[step].title}.</h2>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '1rem', fontStyle: 'italic', opacity: 0.6 }}>{steps[step].desc}</p>
              </div>

              {/* STEP 1: THE FOUNDATION */}
              {step === 0 && (
                <div className="step-card editorial-shadow">
                  <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center' }}>
                    <label className="asymmetric-radius" style={{ width: '100px', height: '100px', background: 'var(--surface-container-low)', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px dashed var(--outline-variant)', position: 'relative' }}>
                      {formData.profileImageUrl ? <img src={formData.profileImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (uploading === 'profile' ? <Loader2 className="animate-spin text-primary" /> : <Camera size={24} style={{ color: 'var(--primary)' }} />)}
                      <input type="file" hidden onChange={(e) => handleFileUpload(e, 'profile')} accept="image/*" />
                    </label>
                    <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group"><label>Full Legal Name</label><input value={formData.fullName} onChange={(e) => updateField('fullName', e.target.value)} placeholder="Legal Name for Verification" /></div>
                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input 
                          type="date" 
                          value={formData.dateOfBirth || ''} 
                          onChange={(e) => updateField('dateOfBirth', e.target.value)} 
                          style={{ colorScheme: 'light' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label>About You</label>
                      <span style={{ fontSize: '10px', color: formData.bio.length < 250 ? 'var(--error)' : 'var(--primary)', fontWeight: 800 }}>{formData.bio.length} / 250 min</span>
                    </div>
                    <textarea value={formData.bio} onChange={(e) => updateField('bio', e.target.value)} style={{ height: '140px' }} placeholder="Describe your philosophy, child-care style, and why you love what you do..." />
                  </div>
                  
                  <div style={{ background: 'var(--primary-fixed-dim)', padding: '1.5rem', borderRadius: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                       <Info size={18} className="text-primary" />
                       <h4 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hiring Modes Explained</h4>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                       <div>
                         <p style={{ fontWeight: 800, fontSize: '10px', color: 'var(--primary)' }}>HOURLY RATE</p>
                         <p style={{ fontSize: '10px', opacity: 0.6, marginTop: '0.25rem' }}>Standard pay for flexible bookings and occasional care.</p>
                       </div>
                       <div>
                         <p style={{ fontWeight: 800, fontSize: '10px', color: 'var(--primary)' }}>WEEKLY RETAINER</p>
                         <p style={{ fontSize: '10px', opacity: 0.6, marginTop: '0.25rem' }}>Fixed pay for consistent, full-time placements. Usually 40+ hours.</p>
                       </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Hourly Rate ($/hr)</label><input type="number" value={formData.hourlyRate} onChange={(e) => updateField('hourlyRate', e.target.value)} /></div>
                    <div className="form-group"><label>Weekly Retainer ($/wk)</label><input type="number" value={formData.weeklyRate} onChange={(e) => updateField('weeklyRate', e.target.value)} /></div>
                  </div>
                </div>
              )}

              {/* STEP 2: THE EXPERTISE */}
              {step === 1 && (
                <div className="space-y-8">
                  <div className="step-card editorial-shadow">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group"><label>Years of Experience</label><input type="number" value={formData.experienceYears} onChange={(e) => updateField('experienceYears', parseInt(e.target.value))} /></div>
                      <div className="form-group"><label>Education</label><input value={formData.education} onChange={(e) => updateField('education', e.target.value)} placeholder="e.g. B.S. Child Psychology" /></div>
                    </div>
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Detailed Experience</label>
                        <span style={{ fontSize: '10px', color: (formData.detailedExperience || "").length < 250 ? 'var(--error)' : 'var(--primary)', fontWeight: 800 }}>{(formData.detailedExperience || "").length} / 250 min</span>
                      </div>
                      <textarea placeholder="Tell us about your previous placements, roles, and responsibilities..." value={formData.detailedExperience} onChange={(e) => updateField('detailedExperience', e.target.value)} style={{ height: '140px' }} />
                    </div>
                    <label style={{ marginBottom: '1rem', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>Core Skills</label>
                    <div className="video-req-grid">
                      {SKILLS.map(s => (
                        <div key={s.name} className={`video-req-chip ${formData.coreSkills.includes(s.name) ? 'active' : ''}`} onClick={() => toggleItem('coreSkills', s.name)}>
                          {s.name} {s.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="step-card editorial-shadow">
                    <h3 className="headline text-xl mb-6 italic tracking-tighter">Placement Specialty</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                      {AGE_SPECIALTIES.map(s => (
                        <div key={s.label} className={`age-specialty-card ${formData.specializations.includes(s.label) ? 'active' : ''}`} style={{ flexDirection: 'row', borderRadius: 'var(--radius-xl)', padding: '1.25rem', justifyContent: 'flex-start' }} onClick={() => toggleItem('specializations', s.label)}>
                          <div className="age-specialty-icon" style={{ width: '48px', height: '48px', borderRadius: '12px' }}>{s.icon}</div>
                          <span style={{ fontWeight: 800, fontSize: '1rem' }}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: LOCATION & TRAVEL */}
              {step === 2 && (
                <div className="space-y-8">
                  <div className="editorial-section">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Finding local families</p>
                    <p className="text-on-surface-variant/60 italic text-sm">
                      We use your location to match you with families in your area. You control exactly how far you're willing to travel for a placement.
                    </p>
                  </div>

                  <div className="step-card editorial-shadow">
                    <div className="form-group relative">
                      <label>Where are you based?</label>
                      <div className="relative group">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary opacity-40 group-focus-within:opacity-100 transition-opacity" />
                        <input 
                          value={locationSearch} 
                          onChange={(e) => handleLocationSearch(e.target.value)} 
                          placeholder="Search for your city or address..." 
                          className="pl-12 bg-surface-container-low border-none shadow-inner"
                        />
                      </div>
                      {suggestions.length > 0 && (
                        <div className="absolute z-[100] left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-outline-variant/10 overflow-hidden animate-in fade-in slide-in-from-top-2">
                          {suggestions.map((f, i) => (
                            <button 
                              key={i} 
                              className="w-full text-left px-6 py-4 hover:bg-primary/5 border-b border-outline-variant/5 last:border-none flex items-center gap-4 transition-colors"
                              onClick={() => selectLocation(f)}
                            >
                              <MapPin size={16} className="text-primary/40" />
                              <div>
                                <p className="text-sm font-bold text-primary">{f.text}</p>
                                <p className="text-[10px] text-on-surface-variant opacity-60 line-clamp-1">{f.place_name}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="form-group bg-white p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm mt-10">
                      <div className="flex justify-between items-end mb-4">
                        <label className="text-[10px] font-black uppercase tracking-widest">Max Commute Distance</label>
                        <div className="text-right">
                          <span className="text-3xl font-black text-primary italic">{formData.maxTravelDistance}</span>
                          <span className="text-xs font-bold opacity-30 ml-1">Miles</span>
                        </div>
                      </div>
                      <input type="range" min="5" max="100" step="5" value={formData.maxTravelDistance} onChange={(e) => updateField('maxTravelDistance', parseInt(e.target.value))} />
                      <div className="banner-primary mt-6" style={{ padding: '0.75rem 1rem', borderRadius: '1rem' }}>
                         <Radio size={16} className="shrink-0" />
                         <p style={{ fontSize: '0.625rem', fontWeight: 800, textTransform: 'uppercase' }}>
                           Active Matching Range
                           <span style={{ display: 'block', fontWeight: 400, textTransform: 'none', opacity: 0.6 }}>Families within {formData.maxTravelDistance} miles see you first.</span>
                         </p>
                      </div>
                    </div>

                    <div className="form-group bg-white p-6 rounded-[2rem] border border-outline-variant/10 shadow-sm mt-8">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                          <h4 style={{ fontWeight: 800, color: 'var(--primary)', fontStyle: 'italic' }}>Transportation</h4>
                          <p style={{ fontSize: '0.625rem', opacity: 0.5 }}>Do you have your own vehicle?</p>
                        </div>
                        <label className="switch">
                          <input type="checkbox" checked={formData.hasCar} onChange={(e) => updateField('hasCar', e.target.checked)} />
                          <span className="slider"></span>
                        </label>
                      </div>
                      {formData.hasCar ? (
                        <textarea placeholder="e.g. I have a reliable SUV with room for car seats." value={formData.carDescription} onChange={(e) => updateField('carDescription', e.target.value)} style={{ background: 'var(--surface-container-low)', border: 'none', height: '80px' }} />
                      ) : (
                        <div className="banner-primary" style={{ padding: '0.75rem 1rem', borderRadius: '1rem', background: 'var(--secondary-container)' }}>
                          <Info size={16} className="shrink-0" />
                          <p style={{ fontSize: '10px', fontWeight: 800 }}>I use reliable public transport</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="step-card editorial-shadow">
                    <label style={{ marginBottom: '1.5rem', display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>General Logistics</label>
                    <div className="video-req-grid">
                      {BENCHMARKS.map(b => (
                        <div key={b.name} className={`video-req-chip ${formData.logistics.includes(b.name) ? 'active' : ''}`} onClick={() => toggleItem('logistics', b.name)}>
                          {b.name} {b.icon}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: PHOTOS & VIDEO */}
              {step === 3 && (
                <div className="space-y-8">
                  <div className="editorial-section">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Families see this first</p>
                    <p className="text-on-surface-variant/60 italic text-sm">
                      These photos and your intro video are what families see when they find your profile. It's your chance to make a great first impression before you even meet.
                    </p>
                  </div>

                  <div className="step-card editorial-shadow">
                    <div className="flex justify-between items-end mb-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Profile Photos</label>
                      <span className="text-[9px] font-black uppercase text-primary italic opacity-60">Hold Ctrl/Cmd to select multiple</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                      {(formData.photos || []).concat(Array(5).fill(null)).slice(0, 5).map((p: any, i: number) => (
                        <label key={i} className="asymmetric-radius" style={{ aspectRatio: '1/1', background: 'var(--surface-container-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden', border: '2px dashed var(--outline-variant)', position: 'relative' }}>
                          {p ? <img src={p} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (uploading === 'portfolio_bulk' ? <Loader2 className="animate-spin text-primary opacity-30" /> : <Plus size={20} className="text-primary/40" />)}
                          <input type="file" hidden multiple onChange={(e) => handleFileUpload(e, 'portfolio', i)} accept="image/*" />
                        </label>
                      ))}
                    </div>
                    <p className="text-[10px] text-on-surface-variant/40 italic">Add up to 5 photos showing your professional side or you in action.</p>
                  </div>

                  <div className="step-card editorial-shadow border-primary/10 bg-primary/5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Video size={20} className="text-primary" />
                        <label style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)' }}>Intro Video</label>
                      </div>
                      {uploadStatus && (
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-black uppercase text-primary animate-pulse">{uploadStatus}</span>
                           {uploading === 'video' && (
                             <button 
                               onClick={() => {
                                 xhrRef?.abort();
                                 setUploading(null);
                                 setUploadStatus("");
                                 setError("Upload canceled.");
                               }}
                               className="p-1 hover:bg-primary/10 rounded-full transition-colors"
                             >
                               <X size={12} className="text-primary" />
                             </button>
                           )}
                        </div>
                      )}
                    </div>
                    
                    {uploading === 'video' ? (
                       <div className="bg-white p-8 rounded-2xl mb-6 shadow-sm border border-outline-variant/10 text-center">
                          <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Upload size={32} className="text-primary animate-bounce" />
                          </div>
                          <div className="mb-2 flex justify-between items-center px-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-primary">Uploading</span>
                             <span className="text-[10px] font-black text-primary">{progress}%</span>
                          </div>
                          <div className="h-3 bg-primary/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${progress}%` }}
                               className="h-full bg-primary"
                               transition={{ duration: 0.3 }}
                             />
                          </div>
                       </div>
                    ) : (
                      <div className="bg-white p-6 rounded-2xl mb-6 shadow-sm border border-outline-variant/10">
                        <h4 className="text-xs font-black italic mb-2 text-primary">Why record an intro?</h4>
                        <p className="text-[11px] text-on-surface-variant/70 leading-relaxed italic">
                          Families love to hear your voice and see your energy before they book an interview. A short 30-second "hello" explaining your approach to childcare helps build trust instantly.
                        </p>
                      </div>
                    )}

                    <label className={`btn btn-primary ${uploading === 'video' ? 'opacity-50 pointer-events-none' : ''}`} style={{ width: '100%', cursor: 'pointer', height: '60px' }}>
                      <Video size={18} /> {formData.videoUrl ? "Change Video" : "Upload Video Intro"}
                      <input type="file" accept="video/*" hidden onChange={(e) => handleFileUpload(e, 'video')} />
                    </label>

                    {formData.videoUrl && !uploading && (
                      <div className="mt-4 rounded-[1.5rem] overflow-hidden border border-outline-variant/10 shadow-lg relative group">
                        <video src={formData.videoUrl} controls style={{ width: '100%', height: '200px', objectFit: 'cover', background: '#000' }} />
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-black/10 shadow-xl">
                              <span className="text-[9px] font-black uppercase text-primary italic">Live Preview</span>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {step < 4 && !isVerifying && (
        <footer className="nav-footer">
          <button className="btn btn-outline" onClick={() => { if(step > 0) setStep(step-1); else window.location.href = "/dashboard/nanny"; }}><ArrowLeft size={18} /> Back</button>
          <button className="btn btn-primary" onClick={handleNext}>
            {step === 3 ? "Submit Profile" : "Continue"} <ArrowRight size={18} />
          </button>
        </footer>
      )}
    </div>
    </div>
  );
}
