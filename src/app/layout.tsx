import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";

export const metadata: Metadata = {
  title: "Bab 1: Bilangan Sampai 100",
  description: "Latihan Interaktif Bab 1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Aturan @font-face akan menangani ini, jadi head bisa kosong jika mau */}
      </head>
      <body>
        <Suspense fallback={<div>Memverifikasi akses Anda...</div>}>
          <AuthGuard>{children}</AuthGuard>
        </Suspense>
      </body>
    </html>
  );
}
