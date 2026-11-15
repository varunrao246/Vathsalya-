import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VATSALYA (वात्सल्य) — Care beyond generations",
  description:
    "AI-powered elderly healthcare and medication management platform designed for dignity, independence, and collaborative family care.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#FDFBF7] text-[#1F2421]">
        {children}
      </body>
    </html>
  );
}
