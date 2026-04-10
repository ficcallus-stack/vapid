import { MaterialIcon } from "@/components/MaterialIcon";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ApplicantHubProps {
  applicants: any[];
}

export function ApplicantHub({ applicants }: ApplicantHubProps) {
  return (
    <section className="space-y-8">
      <div className="flex justify-between items-center px-2">
        <div>
          <h2 className="text-3xl font-black text-primary italic tracking-tighter leading-none">Applicant Hub</h2>
          <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/40 mt-3">Live candidates for your open positions</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-6 hide-scrollbar select-none">
        {applicants.length > 0 ? (
          applicants.map((app) => (
            <div key={app.id} className="min-w-[320px] bg-white p-8 rounded-[3rem] shadow-sm border border-outline-variant/5 flex flex-col items-center text-center group hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
              <div className="w-24 h-24 rounded-full mb-6 ring-8 ring-primary/5 group-hover:ring-primary/10 transition-all overflow-hidden relative">
                <img 
                  alt={app.nannyName} 
                  className="w-full h-full object-cover grayscale-0 group-hover:scale-110 transition-transform duration-700"
                  src={app.nannyImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.nannyName}`} 
                />
              </div>
              
              <div className="space-y-1 mb-6">
                <h4 className="font-headline font-black text-2xl text-primary italic tracking-tight leading-none">{app.nannyName}</h4>
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Newborn Specialist • 8 yrs exp</p>
              </div>

              <div className="flex gap-2 mb-8">
                <span className="bg-tertiary-fixed/30 text-on-tertiary-fixed-variant px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">CPR Certified</span>
                <span className="bg-tertiary-fixed/30 text-on-tertiary-fixed-variant px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">Bi-lingual</span>
              </div>

              <Link 
                href={`/dashboard/parent/jobs/${app.jobId}/applications`}
                className="w-full py-4 bg-surface-container-low rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                Review Application
              </Link>
            </div>
          ))
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center opacity-30 border-4 border-dashed border-outline-variant/10 rounded-[3rem] bg-white/50 italic">
             <MaterialIcon name="person_search" className="text-6xl mb-6" />
             <p className="font-headline font-bold text-xl">Waiting for talent.</p>
             <p className="text-xs mt-2 uppercase tracking-widest">Post a job to start meeting elite caregivers.</p>
          </div>
        )}
      </div>
    </section>
  );
}
