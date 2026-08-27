import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trust & Safety | KindredCare US",
  description: "Learn about KindredCare's rigorous vetting process, security infrastructure, and commitment to the safety of families and caregivers.",
  alternates: {
    canonical: "https://kindredcareus.com/safety",
  }
};

export default function SafetyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
