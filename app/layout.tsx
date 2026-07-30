import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Schiddle — Privacy-First Schedule Optimizer",
  description:
    "Turn messy student notes into an optimized schedule without ever sending real names, schools, or locations to an AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={spaceGrotesk.variable}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
