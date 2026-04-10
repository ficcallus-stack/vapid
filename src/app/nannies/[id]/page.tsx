import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { db } from "@/db";
import { users, nannyProfiles, reviews, bookings, examSubmissions, caregiverVerifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { 
  CheckCircle, 
  Star, 
  MapPin, 
  MessageCircle,
  ShieldCheck,
  Users
} from "lucide-react";
import { syncUser } from "@/lib/user-sync";
import { isNannyLive } from "@/lib/nanny-guards";
import { NannyPublicProfileClient } from "./ProfileClient";

export const dynamic = 'force-dynamic';

const getNanny = cache(async (id: string) => {
  const result = await db.select({
    id: users.id,
    name: users.fullName,
    profileImageUrl: users.profileImageUrl,
    location: nannyProfiles.location,
    experienceYears: nannyProfiles.experienceYears,
    hourlyRate: nannyProfiles.hourlyRate,
    isVerified: nannyProfiles.isVerified,
    bio: nannyProfiles.bio,
    email: users.email,
    photos: nannyProfiles.photos,
    availability: nannyProfiles.availability,
    education: nannyProfiles.education,
    responseTime: nannyProfiles.responseTime,
    lastActive: nannyProfiles.lastActive,
    activeJobsCount: nannyProfiles.activeJobsCount,
    specializations: nannyProfiles.specializations,
    logistics: nannyProfiles.logistics,
    coreSkills: nannyProfiles.coreSkills,
    certifications: nannyProfiles.certifications,
    videoUrl: nannyProfiles.videoUrl,
    maxTravelDistance: nannyProfiles.maxTravelDistance,
    hasCar: nannyProfiles.hasCar,
    carDescription: nannyProfiles.carDescription,
    isGhost: users.isGhost,
    isPremium: users.isPremium,
    backgroundCheckDate: caregiverVerifications.backgroundAuthTimestamp,
  })
  .from(users)
  .innerJoin(nannyProfiles, eq(users.id, nannyProfiles.id))
  .leftJoin(caregiverVerifications, eq(users.id, caregiverVerifications.id))
  .where(eq(users.id, id))
  .limit(1);

  if (!result[0]) return null;

  // Fetch highest exam score (Elite Certification)
  const examResult = await db.select({
    score: examSubmissions.score,
  })
  .from(examSubmissions)
  .where(and(eq(examSubmissions.caregiverId, id), eq(examSubmissions.status, "passed")))
  .orderBy(desc(examSubmissions.score))
  .limit(1);

  return {
    ...result[0],
    maxScore: examResult[0]?.score || null,
  } as any;
});

const getNannyReviews = cache(async (id: string) => {
  const result = await db.select({
    id: reviews.id,
    rating: reviews.rating,
    comment: reviews.comment,
    images: reviews.images,
    replyText: reviews.replyText,
    createdAt: reviews.createdAt,
    reviewer: {
      fullName: users.fullName,
    },
    totalAmount: bookings.totalAmount,
  })
  .from(reviews)
  .innerJoin(users, eq(reviews.reviewerId, users.id))
  .leftJoin(bookings, eq(reviews.bookingId, bookings.id))
  .where(eq(reviews.revieweeId, id))
  .orderBy(desc(reviews.createdAt));

  return result;
});

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const nanny = await getNanny(id);
  
  if (!nanny) return { title: 'Not Found' };
  
  const title = `${nanny.name} - Premium Childcare Excellence | KindredCare`;
  const description = nanny.bio || `Hire ${nanny.name}, a vetted caregiver with ${nanny.experienceYears} years of experience. Rate: $${nanny.hourlyRate}/hr`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      images: [nanny.profileImageUrl || nanny.photos?.[0] || ""],
    }
  };
}

export default async function NannyPublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const nanny = await getNanny(id);
  const currentUser = await syncUser().catch(() => null);

  if (!nanny) {
    notFound();
  }

  const nannyReviews = await getNannyReviews(id);
  const isLive = isNannyLive(nanny, nanny as any); 
  const isOwnProfile = currentUser?.id === id;
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'moderator';

  // Public Restriction: If not live and not authorized to view, show restricted view
  if (!isLive && !isOwnProfile && !isAdmin && !nanny.isGhost) {
    return (
      <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center gap-6 pt-32">
        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
            <MaterialIcon name="verified_user" className="text-4xl text-slate-300" />
        </div>
        <h1 className="font-headline text-4xl font-black text-slate-900 tracking-tighter italic">Profile Restricted</h1>
        <p className="max-w-md text-center text-slate-500 font-medium italic">This caregiver's professional showcase is currently undergoing mandatory verification and quality review.</p>
        <Link href="/browse" className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">Back to Placement Grid</Link>
      </div>
    );
  }

  // Pass everything to the Client Component for the premium UI
  return <NannyPublicProfileClient nanny={nanny} reviews={nannyReviews} />;
}
