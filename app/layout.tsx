import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InkluVision — Platform Belajar Inklusif",
  description:
    "Platform belajar inklusif untuk siswa tunanetra. Akses materi, kerjakan soal, dan dapatkan penjelasan AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${geistSans.variable} antialiased`}>
        <a href="#konten-utama" className="skip-link">
          Lewati ke konten utama
        </a>
        <Navbar />
        <main id="konten-utama" tabIndex={-1}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
