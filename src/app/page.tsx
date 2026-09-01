"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  Search,
  ShieldCheck,
  Sparkles,
  QrCode,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { formatDateRange } from "@/lib/utils";
import type { CertificateDetails } from "@/types";

type SearchState = "idle" | "loading" | "found" | "not-found";

export default function HomePage() {
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<SearchState>("idle");
  const [result, setResult] = useState<CertificateDetails | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setResult(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, code }),
      });
      const data = await res.json();

      if (res.ok && data.certificate) {
        setResult(data.certificate);
        setState("found");
      } else {
        setState("not-found");
      }
    } catch {
      setState("not-found");
    }
  }

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/certificates/${result.certificate_id}/pdf`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${result.certificate_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---- Hero sombre avec halo aurora + grille ---- */}
      <div className="relative overflow-hidden bg-ink-950 pb-28">
        <div className="absolute inset-0 bg-aurora" />
        <div className="absolute inset-0 bg-grid-slate bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,black,transparent)]" />

        {/* Header */}
        <header className="relative z-10">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-glow">
                <ShieldCheck className="h-5 w-5 text-brand-600" />
              </div>
              <span className="text-lg font-bold text-white">TUVA</span>
            </div>
            <a
              href="/login"
              className="text-sm font-medium text-white/60 transition-colors hover:text-white"
            >
              Espace administrateur
            </a>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-2xl px-4 pt-10 text-center sm:px-6 sm:pt-16">
          <span className="kicker mx-auto mb-5 w-fit rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-brand-200">
            <Sparkles className="h-3.5 w-3.5" />
            Plateforme d&apos;attestations
          </span>
          <h1 className="animate-fade-up text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Retrouvez votre <span className="text-gradient">attestation</span>
          </h1>
          <p
            className="mx-auto mt-4 max-w-lg animate-fade-up text-base text-white/60 sm:text-lg"
            style={{ animationDelay: "80ms" }}
          >
            Saisissez votre nom complet et votre code d&apos;attestation pour
            télécharger votre document, en quelques secondes.
          </p>

          <div
            className="mt-8 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-white/50"
            style={{ animationDelay: "160ms" }}
          >
            <span className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-brand-300" />
              Téléchargement instantané
            </span>
            <span className="flex items-center gap-1.5">
              <QrCode className="h-3.5 w-3.5 text-brand-300" />
              Vérifiable par QR code
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-300" />
              100% gratuit
            </span>
          </div>
        </div>
      </div>

      {/* ---- Carte de recherche, en surimpression du hero ---- */}
      <main className="relative z-10 mx-auto -mt-16 max-w-xl px-4 pb-20 sm:px-6">
        <Card className="animate-fade-up rounded-3xl shadow-elevated" style={{ animationDelay: "220ms" }}>
          <CardBody className="p-6 sm:p-8">
            <form onSubmit={handleSearch} className="space-y-4">
              <Input
                label="Nom complet"
                placeholder="Ex : Amadou Issoufou"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Code d'attestation"
                placeholder="Ex : TUVA-7KX92A"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={state === "loading"}
              >
                <Search className="h-4 w-4" />
                Rechercher mon attestation
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Résultat trouvé */}
        {state === "found" && result && (
          <Card className="mt-5 animate-fade-up overflow-hidden rounded-2xl border-emerald-100">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <CardBody className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Attestation trouvée</p>
                  <p className="text-xs text-gray-500">Document authentique généré par TUVA</p>
                </div>
              </div>
              <dl className="mb-6 space-y-2.5 text-sm">
                <Row label="Nom" value={result.full_name} />
                <Row label="Formation" value={result.training_title} />
                <Row
                  label="Date"
                  value={formatDateRange(result.start_date, result.end_date)}
                />
                <Row label="Organisateur" value={result.organizer} />
              </dl>
              <Button
                onClick={handleDownload}
                className="w-full"
                size="lg"
                loading={downloading}
              >
                <Download className="h-4 w-4" />
                Télécharger mon attestation PDF
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Résultat non trouvé */}
        {state === "not-found" && (
          <Card className="mt-5 animate-fade-up overflow-hidden rounded-2xl border-red-100">
            <div className="h-1.5 w-full bg-gradient-to-r from-red-400 to-red-600" />
            <CardBody className="flex items-center gap-3 p-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Aucune attestation trouvée</p>
                <p className="text-xs text-gray-500">
                  Vérifiez l&apos;orthographe de votre nom et votre code d&apos;attestation.
                </p>
              </div>
            </CardBody>
          </Card>
        )}
      </main>

      <footer className="border-t border-gray-100 bg-white py-8">
        <p className="text-center text-xs text-gray-400">
          TUVA — Plateforme de gestion des attestations de participation
        </p>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2.5 last:border-0">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}
