import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TUVA — Vos attestations, en un instant",
  description:
    "Plateforme TUVA : recherchez et téléchargez votre attestation de participation en quelques secondes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-50 font-sans text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
