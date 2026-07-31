"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Download,
  UploadCloud,
  Users,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TrainingForm } from "@/components/admin/TrainingForm";
import { formatDateRange } from "@/lib/utils";
import type { Training, Participant, Certificate } from "@/types";

type ParticipantWithCert = Participant & { certificates: Certificate[] };

export default function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [training, setTraining] = useState<Training | null>(null);
  const [participants, setParticipants] = useState<ParticipantWithCert[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/trainings/${id}`);
    if (res.ok) {
      const data = await res.json();
      setTraining(data.training);
      setParticipants(data.participants || []);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddParticipant(e: React.FormEvent) {
    e.preventDefault();
    setAddingParticipant(true);
    setAddError(null);
    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          training_id: id,
          full_name: newName,
          phone: newPhone || null,
          email: newEmail || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      await load();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setAddingParticipant(false);
    }
  }

  async function handleDeleteParticipant(participantId: string) {
    if (!confirm("Supprimer ce participant et son attestation ?")) return;
    await fetch(`/api/participants/${participantId}`, { method: "DELETE" });
    await load();
  }

  async function handleDeleteTraining() {
    if (
      !confirm(
        "Supprimer cette formation supprimera aussi tous ses participants et attestations. Continuer ?"
      )
    )
      return;
    await fetch(`/api/trainings/${id}`, { method: "DELETE" });
    router.push("/admin/trainings");
  }

  async function handleDownload(certificateId: string, certNumber: string) {
    const res = await fetch(`/api/certificates/${certificateId}/pdf`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!csvFile) return;
    setImporting(true);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("training_id", id);
      formData.append("file", csvFile);
      const res = await fetch("/api/participants/import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur d'import");
      setImportResult(
        `${data.created} participant(s) importé(s) sur ${data.total}${
          data.failed ? `, ${data.failed} échec(s)` : ""
        }.`
      );
      setCsvFile(null);
      await load();
    } catch (err) {
      setImportResult(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setImporting(false);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Chargement…</p>;
  if (!training) return <p className="text-sm text-gray-500">Formation introuvable.</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/admin/trainings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux formations
      </Link>

      {editing ? (
        <>
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            Modifier la formation
          </h1>
          <TrainingForm training={training} />
          <button
            onClick={() => setEditing(false)}
            className="mt-4 text-sm text-gray-500 hover:text-gray-900"
          >
            Annuler la modification
          </button>
        </>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{training.title}</h1>
              <p className="mt-1 text-sm text-gray-500">
                {training.organizer} · {formatDateRange(training.start_date, training.end_date)}
                {training.location ? ` · ${training.location}` : ""}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Formateur : {training.trainer}
              </p>
              {training.description && (
                <p className="mt-3 max-w-xl text-sm text-gray-600">
                  {training.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
              <Button variant="danger" onClick={handleDeleteTraining}>
                <Trash2 className="h-4 w-4" />
                Supprimer
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardBody>
                  <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
                    <Users className="h-4 w-4" />
                    Participants ({participants.length})
                  </h2>

                  {participants.length === 0 ? (
                    <p className="py-6 text-center text-sm text-gray-500">
                      Aucun participant pour le moment.
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {participants.map((p) => {
                        const cert = p.certificates?.[0];
                        return (
                          <li
                            key={p.id}
                            className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{p.full_name}</p>
                              <p className="text-xs text-gray-500">
                                {cert?.certificate_number || "—"}
                                {p.email ? ` · ${p.email}` : ""}
                                {p.phone ? ` · ${p.phone}` : ""}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {cert && (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDownload(cert.id, cert.certificate_number)}
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  PDF
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleDeleteParticipant(p.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardBody>
                  <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                    <Plus className="h-4 w-4" />
                    Ajouter un participant
                  </h2>
                  <form onSubmit={handleAddParticipant} className="space-y-3">
                    <Input
                      placeholder="Nom complet *"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Téléphone (optionnel)"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                    />
                    <Input
                      placeholder="Email (optionnel)"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                    {addError && <p className="text-xs text-red-600">{addError}</p>}
                    <Button type="submit" className="w-full" size="sm" loading={addingParticipant}>
                      Ajouter
                    </Button>
                  </form>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                    <UploadCloud className="h-4 w-4" />
                    Import CSV
                  </h2>
                  <p className="mb-3 text-xs text-gray-500">
                    Colonnes attendues : Nom complet, Téléphone, Email.
                  </p>
                  <form onSubmit={handleImport} className="space-y-3">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-brand-700"
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      size="sm"
                      loading={importing}
                      disabled={!csvFile}
                    >
                      Importer
                    </Button>
                    {importResult && (
                      <p className="text-xs text-gray-600">{importResult}</p>
                    )}
                  </form>
                </CardBody>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
