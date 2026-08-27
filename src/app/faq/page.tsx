"use client";

import { useState, useMemo } from "react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import Link from "next/link";
import FAQStructuredData from "@/components/seo/FAQStructuredData";

type Role = "family" | "nanny";

export default function FAQPage() {
  const [activeRole, setActiveRole] = useState<Role>("family");

  const familySections = [
    {
      id: "vetting",
      title: "Vetting & Safety",
      icon: "security",
      color: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
      questions: [
        {
          q: "How are nannies vetted?",
          a: "Our vetting process is the most rigorous in the industry. It includes a comprehensive multi-state background check, social media screening, professional reference verification, and a mandatory 1-on-1 behavioral interview with our care specialists.",
        },
        {
          q: "When do I get my Global Care badge?",
          a: "The Global Care badge is awarded after a caregiver completes 500 verified hours on the platform with a consistent 4.9+ star rating and maintains active First Aid/CPR certification.",
        },
        {
          q: "What does 'Verified' mean?",
          a: "Every nanny with a 'Verified' badge has passed a multi-state criminal background check, a sex offender registry check, and a social security trace.",
        },
        {
          q: "How are references checked?",
          a: "Our team personally calls at least three previous employers for every nanny to verify dates of employment and performance quality.",
        },
        {
          q: "What if I have an emergency?",
          a: "Premium members have access to a 24/7 incident hotline. In case of safety concerns, we provide immediate mediation and local authority coordination.",
        },
      ],
    },
    {
      id: "payments",
      title: "Payments & Fees",
      icon: "account_balance_wallet",
      color: "bg-secondary-fixed text-on-secondary-fixed-variant",
      questions: [
        {
          q: "How does the $50/month premium plan work?",
          a: "The Premium Family Plan grants you unlimited booking requests, priority access to top-tier nannies, 24/7 concierge support, and waived service fees on backup care bookings.",
        },
        {
          q: "Automated Payroll",
          a: "Weekly payments are handled automatically. We even help with tax documentation for long-term placements.",
        },
      ],
    },
    {
      id: "how-it-works",
      title: "How it Works",
      icon: "auto_fix_high",
      color: "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant",
      questions: [
        {
          q: "How do I start searching for a nanny?",
          a: "Simply create a profile, list your family requirements (hours, location, specialties), and our algorithm will suggest the best-matched caregivers in your area. You can then interview them directly through our secure portal.",
        },
      ],
    },
  ];

  const nannySections = [
    {
      id: "registration",
      title: "Registration & Profile",
      icon: "assignment_ind",
      color: "bg-primary-fixed text-on-primary-fixed",
      content: (
        <article className="space-y-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <h2 className="font-headline text-3xl font-bold text-primary mb-6"> The $65 Registration Fee explained</h2>
              <p className="text-on-surface-variant leading-relaxed text-lg mb-6">Transparency is at the heart of Kindred Care. The one-time registration fee covers the operational costs of launching your professional profile.</p>
              <div className="bg-surface-container-low p-8 rounded-2xl space-y-4">
                <div className="flex gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                    <MaterialIcon name="file_present" className="text-on-tertiary-fixed" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Identity Verification</h4>
                    <p className="text-sm text-on-surface-variant">Secure multi-factor authentication and document processing.</p>
                  </div>
                </div>
                <div className="flex gap-4 text-left">
                  <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center shrink-0">
                    <MaterialIcon name="psychology" className="text-on-tertiary-fixed" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">Behavioral Assessment</h4>
                    <p className="text-sm text-on-surface-variant">Our proprietary matching algorithm setup for your unique skills.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-72 aspect-[4/5] rounded-t-[1.5rem] rounded-br-[1.5rem] rounded-tr-[0.75rem] rounded-bl-[0.75rem] overflow-hidden shadow-xl">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCehU18WqgRUJoRyebwmhgJ6zeKNzasPr4ZmR_NZakIzGLCHzhVLNnzgo-hI-_wwMI8ufMMI0S0yiPzxGvzkPLke-J6HKII-fGu4r9KxP8Ds9a7T6cNwz9js5s0bhGYgYrjPlPT-G8IiuocxK1HJYZdaRHzO4EepIfCwBZL4nkvvevCKzbtUZWYuCUml5nbpn5xfKSjjg-UJpWgdIUzbyZ-UU3qfdXGriH_BQkwz5e7Bg7wbiAVAShIX11ABpUD51ULDIQO-hJtx2w" alt="Nanny" />
            </div>
          </div>
        </article>
      ),
    },
    {
      id: "standards",
      title: "Global Care Standards",
      icon: "verified_user",
      color: "bg-secondary-fixed text-on-secondary-fixed",
      content: (
        <div className="relative p-1 rounded-3xl bg-gradient-to-br from-secondary-fixed to-tertiary-fixed shadow-lg">
          <div className="bg-white p-10 rounded-[1.4rem]">
            <div className="flex items-center gap-4 mb-8">
              <div className="px-4 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold uppercase tracking-widest">Premium Tier</div>
              <h2 className="font-headline text-3xl font-bold text-primary">Global Care Standards ($175) benefits</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div className="space-y-4">
                <p className="text-on-surface-variant leading-relaxed">Elevate your status with our gold-standard certification. Nannies with this badge see 3x higher placement rates.</p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2 text-sm font-medium text-primary">
                    <MaterialIcon name="check_circle" className="text-secondary" fill />
                    Advanced Pediatric First Aid & CPR
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-primary">
                    <MaterialIcon name="check_circle" className="text-secondary" fill />
                    Crisis Management Training
                  </li>
                  <li className="flex items-center gap-2 text-sm font-medium text-primary">
                    <MaterialIcon name="check_circle" className="text-secondary" fill />
                    Global Placement Eligibility
                  </li>
                </ul>
              </div>
              <div className="bg-surface-container-low rounded-2xl p-6 flex flex-col justify-center text-center">
                <div className="text-4xl font-extrabold text-primary mb-2">$175 <span className="text-sm font-normal text-on-surface-variant">/annual</span></div>
                <p className="text-xs text-on-surface-variant mb-6">Fully tax-deductible professional development</p>
                <button className="bg-primary text-on-primary py-3 rounded-xl font-bold hover:bg-primary-container transition-all">Upgrade Profile</button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "visibility",
      title: "Increasing Visibility",
      icon: "send_time_extension",
      color: "bg-tertiary-fixed text-on-tertiary-fixed",
      content: (
        <div className="flex flex-col md:flex-row gap-12 items-center text-left">
          <div className="w-full md:w-1/2 relative space-y-6">
            <h2 className="font-headline text-3xl font-bold text-primary mb-6">Getting more job invites</h2>
            <p className="text-on-surface-variant mb-8 leading-relaxed">Our AI matches nannies based on responsiveness and profile completeness. Here are the top three factors that increase your visibility:</p>
            <div className="space-y-6">
              {[
                { n: "01", t: "Response Rate", d: "Responding within 2 hours boosts your profile to the 'Highly Active' carousel." },
                { n: "02", t: "Dynamic Intro Video", d: "Profiles with a 30-second video get 80% more interview requests." },
                { n: "03", t: "Skill Tagging", d: "Specify niches like 'Multilingual', 'Special Needs', or 'Infant Care' for targeted invites." },
              ].map(item => (
                <div key={item.n} className="flex items-start gap-4">
                  <span className="text-3xl font-black text-secondary-container">{item.n}</span>
                  <div>
                    <h5 className="font-bold text-primary">{item.t}</h5>
                    <p className="text-sm text-on-surface-variant">{item.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-1/2 relative">
             <div className="absolute -top-4 -left-4 w-24 h-24 bg-secondary-fixed rounded-full -z-10 blur-2xl"></div>
             <img 
               className="rounded-3xl shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500 w-full aspect-video object-cover" 
               src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbBIEb6VCrYb98fqYniyyiElbVLPvvx7RW0QZIzgkaxQlvmGOAdeD3IpWFIFD6gdUHHH_zMxudHCRHTyDeThgS_0z49gThPPM9lXrKN3tpYafB54dJzkmHcwrcZK1XMXq5VFTFWLYzdNt0-e4C9cs9-RcaJhiwggvWq3JS5GUDv6n7FtKhsGqfTgLPmzhOXOQFDjz_I4VrDsHb-_Npkp62CQDcaKe8WGqAZ4l_RmHYZoOT7KieGOh6BVONS9b6H-wGK9aBthCTuXM" 
               alt="Nanny focus" 
             />
          </div>
        </div>
      )
    }
  ];

  const activeSections = activeRole === "family" ? familySections : nannySections;

  const faqsForStructuredData = useMemo(() => {
    const allQuestions: { q: string; a: string }[] = [];

    // Extract family questions
    familySections.forEach(section => {
      if ("questions" in section && Array.isArray(section.questions)) {
        allQuestions.push(...section.questions);
      }
    });

    // Extract nanny questions if any were present in simple q/a format
    // Currently, nanny sections use custom content, but this ensures future-proofing
    nannySections.forEach(section => {
      if ("questions" in section && Array.isArray((section as any).questions)) {
        allQuestions.push(...(section as any).questions);
      }
    });

    return allQuestions;
  }, [familySections, nannySections]);

  return (
    <div className="bg-surface font-body text-on-surface antialiased">
      <FAQStructuredData faqs={faqsForStructuredData} />
      <main className="pt-24 min-h-screen">
        {/* Hero Search Section */}
        <section className="max-w-7xl mx-auto px-8 py-16">
          <div className="relative overflow-hidden bg-primary-container rounded-[3rem] p-12 md:p-20 flex flex-col items-center text-center">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-0 right-0 w-96 h-96 bg-secondary-container rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-tertiary-container rounded-full blur-3xl -ml-20 -mb-20"></div>
            </div>
            <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-white mb-6 relative z-10 leading-tight">
              How can we support <br />
              <span className="text-secondary-fixed-dim">your {activeRole === 'family' ? 'family' : 'career'} today?</span>
            </h1>
            <div className="w-full max-w-2xl relative z-10 group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <MaterialIcon name="search" className="text-outline" />
              </div>
              <input
                className="w-full pl-16 pr-6 py-5 bg-surface-container-lowest border-none rounded-2xl shadow-xl focus:ring-4 focus:ring-primary/10 text-on-surface-variant font-body text-lg transition-all"
                placeholder={`Search for '${activeRole === 'family' ? 'Premium membership' : 'Background checks'}', '${activeRole === 'family' ? 'Safety protocols' : 'Registration fee'}'...`}
                type="text"
              />
            </div>
          </div>
        </section>

        {/* Category Toggle */}
        <div className="flex justify-center mb-16 space-x-4">
          <button 
            onClick={() => setActiveRole("family")}
            className={cn(
              "px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-all shadow-lg",
              activeRole === "family" ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            )}
          >
            <MaterialIcon name="family_restroom" className="text-[20px]" fill={activeRole === "family"} />
            For Families
          </button>
          <button 
            onClick={() => setActiveRole("nanny")}
            className={cn(
              "px-8 py-3 rounded-full font-semibold flex items-center gap-2 transition-all shadow-lg",
              activeRole === "nanny" ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"
            )}
          >
            <MaterialIcon name="clinical_notes" className="text-[20px]" fill={activeRole === "nanny"} />
            For Caregivers
          </button>
        </div>

        <section className="max-w-7xl mx-auto px-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar Navigation */}
            <aside className="lg:col-span-3 space-y-8 hidden lg:block">
              <div className="sticky top-32 space-y-2">
                <h3 className="font-headline font-bold text-xs uppercase tracking-widest text-on-surface-variant/60 mb-4 px-4">Categories</h3>
                <nav className="flex flex-col gap-2">
                  {activeSections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl font-medium transition-all group"
                    >
                      <MaterialIcon name={section.icon ?? "help_center"} className="text-xl group-hover:text-primary transition-colors" />
                      {section.title}
                    </a>
                  ))}
                </nav>
                <div className="mt-8 p-6 bg-secondary-fixed rounded-2xl rounded-tl-[1.5rem] rounded-br-[1.5rem] rounded-tr-[0.75rem] rounded-bl-[0.75rem]">
                  <p className="font-headline font-bold text-on-secondary-fixed mb-2">Need direct help?</p>
                  <p className="text-on-secondary-fixed-variant text-sm mb-4 leading-relaxed">Our concierge team is available 24/7 for our community.</p>
                  <a href="/dashboard/support" className="w-full bg-on-secondary-fixed text-white py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-all text-center block">Contact Us</a>
                </div>
              </div>
            </aside>

            {/* FAQ Content Area */}
            <div className="lg:col-span-9 space-y-24">
              {activeSections.map((section) => (
                <div key={section.id} id={section.id} className="scroll-mt-32">
                  <div className="flex items-center gap-4 mb-8">
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", section.color)}>
                      <MaterialIcon name={section.icon ?? "star"} />
                    </div>
                    <h2 className="font-headline text-3xl font-bold text-primary">{section.title}</h2>
                  </div>

                  {"questions" in section && (section as any).questions ? (
                    <div className="space-y-4">
                      {(section as any).questions.map((item: any, idx: number) => (
                        <details key={idx} className="group bg-surface-container-low rounded-2xl border border-transparent hover:border-outline-variant/10 transition-all overflow-hidden shadow-sm hover:shadow-md">
                          <summary className="flex items-center justify-between p-6 cursor-pointer list-none select-none">
                            <span className="font-headline font-semibold text-lg text-primary">{item.q}</span>
                            <MaterialIcon name="expand_more" className="transition-transform group-open:rotate-180" />
                          </summary>
                          <div className="px-6 pb-6 text-on-surface-variant leading-relaxed text-left">
                            {item.a}
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    (section as any).content
                  )}
                </div>
              ))}

              {/* Editorial Break - Only for Families */}
              {activeRole === "family" && (
                <div className="relative bg-primary-container rounded-[2rem] p-12 overflow-hidden flex flex-col md:flex-row items-center gap-10">
                  <div className="relative z-10 md:w-1/2 text-left">
                    <h3 className="text-3xl font-headline font-bold text-white mb-4">A legacy of trust.</h3>
                    <p className="text-on-primary-container text-lg leading-relaxed">We believe every family deserves peace of mind. Our support team is available 24/7 to answer your specific childcare questions.</p>
                  </div>
                  <div className="md:w-1/2 relative">
                    <img 
                      alt="Nanny caring for child" 
                      className="rounded-3xl shadow-2xl transform rotate-3 scale-110" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlfoxtmFU6sPJrxs6ohFR0sa8urj7Tzm5CQoKJFPFvwJVTXayYzoo_Ik5iTaNnMSlQjm6v8S_ngg84ZjjTv1_xloSs9mCTt7zTqRu46IdCNjZ20hwZProSfpemm06DGrFWvZQRCXm9rhlLVdyLOjj5ZryLEb1xQUBq86hAj_n7dbZJ-nRzEH2W-iE8tboOZQzb5pp52zps0o_ohjm2Kiny8jGICZSuI0I4waAo_5GoyKZkh5M8Hs2OzplUrCRFRMAVIcg2tyNvXIo" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Still have questions? CTA */}
        <section className="bg-secondary-fixed py-24 px-8 text-center border-t border-outline-variant/10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="font-headline text-4xl md:text-5xl font-extrabold text-on-secondary-fixed tracking-tight">Still have questions?</h2>
            <p className="text-on-secondary-fixed-variant text-lg max-w-xl mx-auto leading-relaxed">
              Our KindredCare concierge team is here to help you find the peace of mind your family deserves. Reach out anytime.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <a href="/dashboard/support" className="bg-primary text-white px-10 py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg active:scale-95">
                <MaterialIcon name="mail" />
                Contact Support
              </a>
              <a href="/dashboard/support" className="bg-white text-primary px-10 py-4 rounded-xl font-bold border border-primary/10 flex items-center justify-center gap-2 hover:bg-surface-container-low transition-all shadow-sm active:scale-95">
                <MaterialIcon name="chat_bubble" />
                Live Chat
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
