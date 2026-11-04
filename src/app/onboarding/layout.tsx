import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School Onboarding",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
