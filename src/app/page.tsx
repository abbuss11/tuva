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
  ArrowRight,
  BadgeCheck,
  FileText,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardBody } from "@/components/ui/Card";
import { formatDateRange } from "@/lib/utils";
import type { CertificateDetails } from "@/types";

type SearchState = "idle" | "loading" | "found" | "not-found";

const features = [
  {
    icon: ShieldCheck,
    title: "Authentification sécurisée",
    description: "Chaque attestation est vérifiable via QR code et référence unique.",
  },
  {
    icon: FileText,
    title: "Téléchargement instantané",
    description: "Récupérez votre certificat PDF en quelques secondes, sans étape inutile.",
  },
  {
    icon: BadgeCheck,
    title: "Confiance et transparence",
    description: "Des données claires, un parcours simple et une délivrance professionnelle.",
  },
];

const steps = [
  "Saisissez votre nom complet et votre code d’attestation.",
  "Validez l’attestation correspondante à votre formation.",
  "Téléchargez votre certificat PDF ou vérifiez sa validité.",
];

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
      if (!res.ok) throw new Error("Téléchargement impossible");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const fileName = `${result.certificate_number}.pdf`;

      a.href = url;
      a.download = fileName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => window.URL.revokeObjectURL(url), 1500);
    } catch {
      window.open(`/api/certificates/${result.certificate_id}/pdf`, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.22),transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.2),transparent_30%)]" />

      <header className="relative z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-lg shadow-blue-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">TUVA</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a href="#avantages" className="transition hover:text-white">Avantages</a>
            <a href="#verification" className="transition hover:text-white">Vérification</a>

          </nav>
        </div>
      </header>

      <main className="relative">
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                <Sparkles className="h-3.5 w-3.5" />
                Plateforme d’attestations
              </span>

              <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Accédez à votre <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-violet-300 bg-clip-text text-transparent">certificat</span> en quelques secondes.
              </h1>

              <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
                TUVA centralise la gestion, la vérification et le téléchargement des attestations de participation pour une expérience rapide, fiable et professionnelle.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#verification"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Vérifier mon attestation
                  <ArrowRight className="h-4 w-4" />
                </a>

              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-300" />
                  Téléchargement instantané
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-violet-300" />
                  Vérification QR
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-300" />
                  Données sécurisées
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-blue-950/40 backdrop-blur-xl">
              <div className="rounded-2xl border border-blue-400/20 bg-slate-900/90 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Service</p>
                    <p className="mt-1 text-xl font-bold text-white">Attestation</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Formation</p>
                    <p className="mt-2 font-medium text-white">Gestion de projet agile</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Participant</p>
                    <p className="mt-2 font-medium text-white">Ali Nouhou</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Statut</p>
                    <p className="mt-2 font-medium text-emerald-300">Certificat valide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="avantages" className="border-y border-white/10 bg-slate-900/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300">Pourquoi TUVA</p>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Une expérience d’attestation pensée pour les participants.</h2>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="verification" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Comment ça marche</p>
              <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Récupérer votre attestation en 3 étapes simples.</h2>

              <div className="mt-8 space-y-5">
                {steps.map((text, index) => (
                  <div key={text} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-sm font-bold text-blue-200">
                      {index + 1}
                    </div>
                    <p className="pt-1 text-slate-200">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
              <Card className="rounded-2xl border border-white/10 bg-slate-950/60 shadow-none">
                <CardBody className="p-6 sm:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-300">
                      <Search className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Recherche rapide</p>
                      <p className="font-semibold text-white">Vérifier mon attestation</p>
                    </div>
                  </div>

                  <form onSubmit={handleSearch} className="space-y-4">
                    <Input
                      label="Nom complet"
                      placeholder="Ex : Amadou Issoufou"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                    <Input
                      label="Code d’attestation"
                      placeholder="Ex : TUVA-7KX92A"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      required
                    />
                    <Button type="submit" className="w-full" size="lg" loading={state === "loading"}>
                      <Search className="h-4 w-4" />
                      Rechercher mon attestation
                    </Button>
                  </form>

                  {state === "found" && result && (
                    <Card className="mt-5 border-emerald-500/20 bg-emerald-500/5">
                      <CardBody className="p-4">
                        <div className="mb-4 flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                            <CheckCircle2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-white">Attestation trouvée</p>
                            <p className="text-xs text-slate-400">Document authentique généré par TUVA</p>
                          </div>
                        </div>

                        <dl className="mb-5 space-y-2 text-sm text-slate-200">
                          <Row label="Nom" value={result.full_name} />
                          <Row label="Formation" value={result.training_title} />
                          <Row label="Date" value={formatDateRange(result.start_date, result.end_date)} />
                          <Row label="Organisateur" value={result.organizer} />
                        </dl>

                        <Button onClick={handleDownload} className="w-full" size="lg" loading={downloading}>
                          <Download className="h-4 w-4" />
                          Télécharger mon attestation PDF
                        </Button>
                      </CardBody>
                    </Card>
                  )}

                  {state === "not-found" && (
                    <Card className="mt-5 border-red-500/20 bg-red-500/5">
                      <CardBody className="flex items-center gap-3 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                          <XCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">Aucune attestation trouvée</p>
                          <p className="text-xs text-slate-400">
                            Vérifiez l’orthographe du nom et votre code d’attestation.
                          </p>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950 py-8">
        <p className="text-center text-xs text-slate-400">
          TUVA — Plateforme de gestion des attestations de participation
        </p>
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-2 last:border-b-0">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-right font-medium text-white">{value}</dd>
    </div>
  );
}
