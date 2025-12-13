import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

// Comprehensive SEO Metadata for AnonWork
export const metadata: Metadata = {
  // Basic metadata
  title: {
    default: "AnonWork - Anonymous Professional Community | Speak Freely, Stay Anonymous",
    template: "%s | AnonWork",
  },
  description: "Join the #1 anonymous professional community. Share insights, discuss salaries, review companies, and connect with verified professionals - all while staying completely anonymous. Free to join.",
  
  // Application info
  applicationName: "AnonWork",
  generator: "Next.js",
  keywords: [
    "anonymous professional community",
    "anonymous workplace discussions",
    "anonymous salary sharing",
    "company reviews anonymous",
    "blind alternative",
    "anonymous work chat",
    "professional networking anonymous",
    "workplace insights",
    "salary transparency",
    "anonymous career advice",
    "verified employee reviews",
    "anonwork",
    "anon work",
    "anonymous work platform",
    "workplace gossip anonymous",
    "tech salary discussions",
    "anonymous professional network",
  ],
  
  // Authors and creator
  authors: [{ name: "AnonWork Team" }],
  creator: "AnonWork",
  publisher: "AnonWork",
  
  // Robots directives for SEO
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Canonical URL
  metadataBase: new URL("https://www.anonwork.tech"),
  alternates: {
    canonical: "/",
  },
  
  // Open Graph for social sharing
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.anonwork.tech",
    siteName: "AnonWork",
    title: "AnonWork - Anonymous Professional Community",
    description: "Join the #1 anonymous professional community. Share insights, discuss salaries, and connect with verified professionals - completely anonymously.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "AnonWork - Speak Freely, Stay Anonymous",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "AnonWork - Anonymous Professional Community",
    description: "Join the #1 anonymous professional community. Share insights, discuss salaries, and connect with verified professionals.",
    images: ["/og-image.png"],
    creator: "@anonwork",
  },
  
  // Favicon and Icons
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  
  // Manifest for PWA
  manifest: "/manifest.json",
  
  // Verification for search engines (add your actual verification codes)
  verification: {
    google: "your-google-verification-code", // Replace with actual code from Google Search Console
  },
  
  // Category
  category: "technology",
};

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#8b5cf6" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1625" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Preconnect to important origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data for Google - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "AnonWork",
              url: "https://www.anonwork.tech",
              description: "The #1 anonymous professional community for sharing insights, salaries, and company reviews.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://www.anonwork.tech/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
        
        {/* Structured Data for Google - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "AnonWork",
              url: "https://www.anonwork.tech",
              logo: "https://www.anonwork.tech/icon.png",
              sameAs: [],
              description: "Anonymous professional community for workplace discussions, salary sharing, and company reviews."
            }),
          }}
        />
        
        {/* Structured Data for Google - WebApplication */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "AnonWork",
              url: "https://www.anonwork.tech",
              applicationCategory: "SocialNetworkingApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD"
              }
            }),
          }}
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
