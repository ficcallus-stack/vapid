import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | KindredCare US",
  description: "Find answers to common questions about our childcare services, pricing, and how to get started.",
  alternates: {
    canonical: "https://kindredcareus.com/faq",
  }
};

export default function FAQLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
