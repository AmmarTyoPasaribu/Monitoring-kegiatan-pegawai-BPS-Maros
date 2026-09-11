import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jakarta = Manrope({
  variable: "--font-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Monitoring Kegiatan Pegawai — BPS Kabupaten Maros",
  description: "Sistem monitoring kegiatan harian pegawai BPS Kabupaten Maros",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col text-slate-900">
        {children}
        <Toaster position="top-center" richColors closeButton offset={{ top: 84 }} mobileOffset={{ top: 84 }} />
      </body>
    </html>
  );
}
