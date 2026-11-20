import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import BackgroundCanvas from "@/components/BackgroundCanvas";
import CustomCursor from "@/components/CustomCursor";
import Motion from "@/components/Motion";
import { profile, projects, siteUrl } from "@/lib/data";
import "./globals.css";
import "./sections.css";
import "./hero-fx.css";
import "./projects.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

const title = `${profile.shortName} — ${profile.role} in Kerala, India`;
const description =
  "Portfolio of Muhammed Ilyas MK, a full stack developer building multi-role SaaS platforms, REST APIs and AI-powered products with Next.js, React, Node.js, MongoDB, MySQL and Redis.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: { canonical: "/" },
  keywords: [
    "Muhammed Ilyas MK",
    "Full Stack Developer",
    "MERN Stack Developer",
    "Next.js developer Kerala",
    "React",
    "Node.js",
    "MongoDB",
    "Redis",
    "RBAC",
  ],
  authors: [{ name: profile.name }],
  openGraph: { type: "profile", title, description, url: "/", siteName: profile.shortName, locale: "en_IN" },
  twitter: { card: "summary_large_image", title, description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: "#08090d", width: "device-width", initialScale: 1, colorScheme: "dark" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  alternateName: profile.shortName,
  jobTitle: profile.role,
  email: `mailto:${profile.email}`,
  url: siteUrl,
  address: { "@type": "PostalAddress", addressLocality: "Malappuram", addressRegion: "Kerala", addressCountry: "IN" },
  worksFor: { "@type": "Organization", name: profile.employer },
  alumniOf: { "@type": "CollegeOrUniversity", name: "Ponnaiyah Ramajayam Institute of Science & Technology" },
  knowsAbout: ["Next.js", "React", "Node.js", "Express.js", "MongoDB", "MySQL", "Redis", "REST APIs", "RBAC", "Technical SEO"],
  sameAs: [profile.linkedin, profile.github, ...projects.map((p) => p.url)].filter(Boolean),
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      </head>
      <body>
        <BackgroundCanvas />
        <CustomCursor />
        {children}
        <Motion />
      </body>
    </html>
  );
}
