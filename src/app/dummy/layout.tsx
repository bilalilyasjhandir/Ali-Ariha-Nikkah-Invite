import type { Metadata } from "next";
import type { ReactNode } from "react";

// TEMPORARY: two ways to reveal the venue, for the couple to choose between.
// Delete this whole folder once one is chosen.
export const metadata: Metadata = {
  title: "Venue reveal — options",
  robots: { index: false, follow: false },
};

export default function DummyLayout({ children }: { children: ReactNode }) {
  return children;
}
