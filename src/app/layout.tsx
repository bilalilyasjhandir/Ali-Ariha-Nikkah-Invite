import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Pinyon_Script, Jost, Amiri } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

// engraved copperplate; its capital A reads unambiguously (Great Vibes' read as "U")
const script = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: ["400"],
});

const sans = Jost({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const arabic = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

// What a guest sees in the WhatsApp bubble and the browser tab. The preview
// image is app/opengraph-image.jpg; on Vercel its URL resolves against the
// production domain automatically.
export const metadata: Metadata = {
  title: "The Nikkah of Ali & Ariha",
  description: "You are warmly invited. Tap to open your invitation.",
  openGraph: {
    title: "The Nikkah of Ali & Ariha",
    description: "You are warmly invited. Tap to open your invitation.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

// the browser bar takes the linen's colour instead of flashing white
export const viewport: Viewport = {
  themeColor: "#bfc9ce",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${script.variable} ${sans.variable} ${arabic.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
