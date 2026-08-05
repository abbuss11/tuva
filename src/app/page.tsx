"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Download,
  Search,
  ShieldCheck,
  Loader2,
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
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">TUVA</span>
          </div>

        </div>
      </header>

      {/* Hero + Form */}
      <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Retrouvez votre attestation
          </h1>
          <p className="mt-3 text-base text-gray-500">
            Saisissez votre nom complet et votre code d&apos;attestation pour
            télécharger votre document en PDF.
          </p>
        </div>

        <Card>
          <CardBody>
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
                Rechercher
              </Button>
            </form>
          </CardBody>
        </Card>

        {/* Résultat trouvé */}
        {state === "found" && result && (
          <Card className="mt-6 border-green-200 bg-green-50/50">
            <CardBody>
              <div className="mb-4 flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">Attestation trouvée</span>
              </div>
              <dl className="mb-5 space-y-2 text-sm">
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
          <Card className="mt-6 border-red-200 bg-red-50/50">
            <CardBody className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">
                Aucune attestation trouvée. Vérifiez votre nom et votre code.
              </span>
            </CardBody>
          </Card>
        )}
      </main>

      <footer className="mx-auto max-w-2xl px-4 pb-10 text-center text-xs text-gray-400 sm:px-6">
        TUVA — Plateforme de gestion des attestations de participation
      </footer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-green-100 pb-2 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{value}</dd>
    </div>
  );
}
