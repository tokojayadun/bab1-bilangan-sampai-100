import type { Metadata } from "next";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard"; // <-- IMPOR BARU

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
        <AuthGuard>
          {" "}
          {/* <-- BUNGKUS DENGAN AUTHGUARD */}
          {children}
        </AuthGuard>
      </body>
    </html>
  );
}
