import { requireUser } from "@/lib/get-server-user";
import Link from "next/link";
import { getVerificationData } from "./actions";
import VerificationWizard from "./VerificationWizard";
import { SuccessState, PendingState, RejectedState } from "./StatusScreens";
import { Star } from "lucide-react";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

import CertificationsOverview from "@/components/dashboard/CertificationsOverview";

export default async function VerificationPage() {
  const authUser = await requireUser();
  
  // Fetch everything in parallel to reduce waterfall delay
  const [userData, initialData] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, authUser.uid)
    }),
    getVerificationData(authUser.uid)
  ]);
  
  if (!userData) throw new Error("User profile not found");

  let status = initialData?.verification?.status || "none";

  // PREREQUISITE: Profile must be 100% complete before verification
  const isProfileComplete = 
    (initialData.profile?.bio?.length || 0) >= 250 &&
    initialData.profile?.location &&
    initialData.profile?.videoUrl &&
    (initialData.profile?.detailedExperience?.length || 0) >= 250;

  if (!isProfileComplete) {
    return (
      <main className="py-20 max-w-7xl mx-auto min-h-screen px-4 md:px-8 flex items-center justify-center">
        <div className="step-card max-w-md w-full text-center py-20 editorial-shadow">
           <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary mx-auto mb-8">
              <Star size={32} />
           </div>
           <h1 className="text-3xl font-black italic tracking-tighter text-primary mb-4">Finish your profile first</h1>
           <p className="text-on-surface-variant/60 italic text-sm mb-10 leading-relaxed px-6">
             You need to finish your professional profile before you can start the verification. Please make sure you've added your bio, experience, and intro video.
           </p>
           <Link href="/dashboard/nanny/profile" className="btn btn-primary w-full inline-block text-center">Go to Profile</Link>
        </div>
      </main>
    );
  }

  // HEAL-VETTING: Force back to draft if critical fields are missing but status is pending
  if (status === "pending" && (!initialData?.verification?.idFrontUrl || !initialData?.verification?.references)) {
    status = "draft";
  }

  let statusContent;

  if (status === "verified") {
    statusContent = <SuccessState user={userData} />;
  } else if (status === "pending") {
    statusContent = <PendingState user={userData} />;
  } else if (status === "rejected") {
    statusContent = <RejectedState user={userData} verification={initialData.verification} />;
  } else {
    statusContent = <VerificationWizard initialData={initialData} user={userData} />;
  }

  return (
    <main className="py-20 max-w-7xl mx-auto min-h-screen px-4 md:px-8">
      {statusContent}
      
      {/* Certifications Merge */}
      <CertificationsOverview />
    </main>
  );
}
