import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P, Cousine } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
});

// Cousine supports Hebrew characters in monospace
const cousine = Cousine({
  variable: "--font-cousine",
  weight: ["400", "700"],
  subsets: ["latin", "hebrew"],
});

export const metadata: Metadata = {
  title: "TypeRead - Read by Typing",
  description: "Improve your typing while reading articles that matter to you",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pressStart.variable} ${cousine.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
