import { syncUser } from "@/lib/user-sync";
import { db } from "@/db";
import { nannyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import ProfileWizard from "./ProfileWizard";
import { safeParseJson } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function NannyProfilePage() {
  const user = await syncUser();

  if (!user) {
    redirect("/login");
  }

  // Security check: Only nannies can access this page
  if (user.role !== "caregiver") {
    redirect("/dashboard/parent");
  }

  // Fetch the nanny profile details
  const profileDetails = await db.query.nannyProfiles.findFirst({
    where: eq(nannyProfiles.id, user.id),
  });

  const initialData = {
    fullName: user.fullName,
    profileImageUrl: user.profileImageUrl || "",
    location: profileDetails?.location || "",
    latitude: profileDetails?.latitude ? Number(profileDetails.latitude) : undefined,
    longitude: profileDetails?.longitude ? Number(profileDetails.longitude) : undefined,
    hourlyRate: profileDetails?.hourlyRate || "35",
    weeklyRate: profileDetails?.weeklyRate || "1200",
    experienceYears: profileDetails?.experienceYears || 0,
    bio: profileDetails?.bio || "",
    photos: safeParseJson<string[]>(profileDetails?.photos, []),
    education: profileDetails?.education || "",
    coreSkills: safeParseJson<string[]>(profileDetails?.coreSkills, []),
    specializations: safeParseJson<string[]>(profileDetails?.specializations, []),
    videoUrl: profileDetails?.videoUrl || "",
    availability: safeParseJson<Record<string, any>>(profileDetails?.availability, {}),
    logistics: safeParseJson<string[]>(profileDetails?.logistics, []),
    lastNameUpdateAt: profileDetails?.lastNameUpdateAt,
    hasCar: profileDetails?.hasCar ?? false,
    carDescription: profileDetails?.carDescription || "",
    detailedExperience: profileDetails?.detailedExperience || "",
  };

  return <ProfileWizard initialData={initialData} />;
}
