import { MetadataRoute } from 'next';
import { db } from "@/db";
import { users, nannyProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const BASE_URL = 'https://kindredcareus.com';
const URLS_PER_SITEMAP = 50000;

export async function generateSitemaps() {
  // ID 0 = Core Pages
  // ID 1 = Nanny Profiles
  return [{ id: 0 }, { id: 1 }];
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    return [
      { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${BASE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
      { url: `${BASE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
      { url: `${BASE_URL}/cookies`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
      { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ];
  }

  if (id === 1) {
    // Get all nannies for chunk 1
    const nannies = await db.select({ id: users.id })
      .from(users)
      .innerJoin(nannyProfiles, eq(users.id, nannyProfiles.id))
      .where(eq(users.role, "caregiver"))
      .limit(URLS_PER_SITEMAP);

    return nannies.map((nanny) => ({
      url: `${BASE_URL}/nannies/${nanny.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  }

  return [];
}
