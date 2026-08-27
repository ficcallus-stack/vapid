import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/Toast";
import { AuthProvider } from "@/lib/auth-context";
import CookieBanner from "@/components/CookieBanner";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { AuthGuard } from "@/components/providers/AuthGuard";
import AblyClientProvider from "@/components/AblyProvider";
import Navbar from "@/components/Navbar";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kindredcareus.com"),
  title: "KindredCare US | Trusted Childcare Professionals",
  description: "Bespoke Care for Your Little Ones. Connecting elite families with the nation's most trusted, certified caregivers.",
  keywords: ["nanny", "childcare", "babysitter", "caregiver", "KindredCare", "US"],
  openGraph: {
    title: "KindredCare US | Trusted Childcare Professionals",
    description: "Connecting elite families with the nation's most trusted, certified caregivers.",
    siteName: "KindredCare US",
    type: "website",
  },
  icons: {
    icon: "/favicon.png",
  },
};

import { cookies } from "next/headers";
import ImpersonationBanner from "@/components/admin/ImpersonationBanner";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check for Ghost Protocol Impersonation
  const cookieStore = await cookies();
  const isImpersonating = !!cookieStore.get("admin_session_backup")?.value;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://kindredcareus.com/#organization",
        "name": "KindredCare US",
        "url": "https://kindredcareus.com",
        "logo": "https://kindredcareus.com/favicon.png",
        "description": "Bespoke Care for Your Little Ones. Connecting elite families with the nation's most trusted, certified caregivers.",
        "sameAs": [
          "https://www.facebook.com/kindredcareus",
          "https://www.instagram.com/kindredcareus"
        ]
      },
      {
        "@type": "WebSite",
        "@id": "https://kindredcareus.com/#website",
        "url": "https://kindredcareus.com",
        "name": "KindredCare US",
        "description": "Trusted Childcare Professionals",
        "publisher": {
          "@id": "https://kindredcareus.com/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://kindredcareus.com/browse?location={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        },
        "hasPart": [
          {
            "@type": "WebPage",
            "name": "Sign up for KindredCare",
            "url": "https://kindredcareus.com/signup"
          },
          {
            "@type": "WebPage",
            "name": "Browse Nannies",
            "url": "https://kindredcareus.com/browse"
          },
          {
            "@type": "WebPage",
            "name": "Trust & Safety",
            "url": "https://kindredcareus.com/safety"
          },
          {
            "@type": "WebPage",
            "name": "FAQ",
            "url": "https://kindredcareus.com/faq"
          }
        ]
      }
    ]
  };

  return (
    <AuthProvider>
      <html lang="en" className={`${plusJakartaSans.variable} ${inter.variable}`}>
        <head>
          <link
            href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
            rel="stylesheet"
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className="antialiased bg-surface text-on-surface font-body min-h-screen flex flex-col">
          <ImpersonationBanner isImpersonating={isImpersonating} />
          <ToastProvider>
            <AuthGuard />
            <PostHogProvider>
              <AblyClientProvider>
                <Navbar />
                <main className="flex-grow">
                  {children}
                </main>
              </AblyClientProvider>
            </PostHogProvider>
          </ToastProvider>
          <Footer />
          <CookieBanner />
        </body>
      </html>
    </AuthProvider>
  );
}
