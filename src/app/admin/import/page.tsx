"use client";

import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Training } from "@/types";

export default function ImportPage() {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [trainingId, setTrainingId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/trainings")
      .then((res) => res.json())
      .then((data) => setTrainings(data.trainings || []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trainingId || !file) return;
    setImporting(true);
    setResult(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("training_id", trainingId);
      formData.append("file", file);
      const res = await fetch("/api/participants/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'import");
      setResult(
        `${data.created} participant(s) importé(s) sur ${data.total}${
          data.failed ? `, ${data.failed} échec(s)` : ""
        }.`
      );
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-bold text-gray-900">Import CSV</h1>
      <p className="mb-6 text-sm text-gray-500">
        Importez une liste de participants pour une formation existante.
        Colonnes attendues : <span className="font-medium">Nom complet</span>,{" "}
        <span className="font-medium">Téléphone</span>,{" "}
        <span className="font-medium">Email</span>.
      </p>

      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Formation</label>
              <select
                className="input"
                value={trainingId}
                onChange={(e) => setTrainingId(e.target.value)}
                required
              >
                <option value="">Sélectionner une formation…</option>
                {trainings.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Fichier CSV</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {result && <p className="text-sm text-green-600">{result}</p>}

            <Button type="submit" className="w-full" loading={importing} disabled={!trainingId || !file}>
              <UploadCloud className="h-4 w-4" />
              Importer les participants
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
