import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Link Page Dashboard",
  robots: { index: false, follow: false },
};

export default function LinkPageDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
