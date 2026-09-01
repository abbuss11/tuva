"use client";

import { useState } from "react";
import { Search, Download, FileSearch } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatDateRange } from "@/lib/utils";
import type { CertificateDetails } from "@/types";

export default function AdminSearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CertificateDetails[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/admin-search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownload(cert: CertificateDetails) {
    const res = await fetch(`/api/certificates/${cert.certificate_id}/pdf`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cert.certificate_number}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="kicker mb-1.5">Recherche</p>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-gray-900">Recherche globale</h1>
      <p className="mb-6 text-sm text-gray-500">
        Recherchez par nom de participant, titre de formation ou numéro d&apos;attestation.
      </p>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <Input
          placeholder="Ex : Amadou, DevWeek 2026, TUVA-7KX92A…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Button type="submit" loading={loading}>
          <Search className="h-4 w-4" />
          Rechercher
        </Button>
      </form>

      {results !== null && results.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-2 py-12 text-center">
            <FileSearch className="h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Aucun résultat pour cette recherche.</p>
          </CardBody>
        </Card>
      )}

      <div className="space-y-3">
        {results?.map((cert) => (
          <Card key={cert.certificate_id} className="transition-shadow hover:shadow-elevated">
            <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-gray-900">{cert.full_name}</p>
                <p className="text-sm text-gray-500">{cert.training_title}</p>
                <p className="mt-0.5 font-mono text-xs text-gray-400">
                  {cert.certificate_number} · {formatDateRange(cert.start_date, cert.end_date)}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleDownload(cert)}>
                <Download className="h-3.5 w-3.5" />
                Télécharger le PDF
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
