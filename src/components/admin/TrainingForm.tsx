"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { UploadCloud, Check } from "lucide-react";
import type { Training } from "@/types";

type Props = {
  training?: Training;
};

async function uploadFile(file: File, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Échec de l'upload");
  return data.url as string;
}

export function TrainingForm({ training }: Props) {
  const router = useRouter();
  const isEdit = Boolean(training);

  const [form, setForm] = useState({
    title: training?.title || "",
    description: training?.description || "",
    organizer: training?.organizer || "",
    trainer: training?.trainer || "",
    location: training?.location || "",
    start_date: training?.start_date || "",
    end_date: training?.end_date || "",
  });
  const [logoUrl, setLogoUrl] = useState(training?.organizer_logo_url || "");
  const [signatureUrl, setSignatureUrl] = useState(
    training?.trainer_signature_url || ""
  );
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSig, setUploadingSig] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setError(null);
    try {
      const url = await uploadFile(file, "logos");
      setLogoUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload du logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSignatureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSig(true);
    setError(null);
    try {
      const url = await uploadFile(file, "signatures");
      setSignatureUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload de la signature");
    } finally {
      setUploadingSig(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      organizer_logo_url: logoUrl || null,
      trainer_signature_url: signatureUrl || null,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/trainings/${training!.id}` : "/api/trainings",
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement");

      const id = isEdit ? training!.id : data.training.id;
      router.push(`/admin/trainings/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <Input
            label="Titre de la formation *"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Ex : Formation en développement web"
            required
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            placeholder="Brève description de la formation"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Organisateur *"
              value={form.organizer}
              onChange={(e) => update("organizer", e.target.value)}
              required
            />
            <Input
              label="Nom du formateur *"
              value={form.trainer}
              onChange={(e) => update("trainer", e.target.value)}
              required
            />
          </div>
          <Input
            label="Lieu"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            placeholder="Ex : Niamey, Niger"
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date de début *"
              type="date"
              value={form.start_date}
              onChange={(e) => update("start_date", e.target.value)}
              required
            />
            <Input
              label="Date de fin *"
              type="date"
              value={form.end_date}
              onChange={(e) => update("end_date", e.target.value)}
              required
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <ImageUploadField
            label="Logo de l'organisateur"
            uploading={uploadingLogo}
            previewUrl={logoUrl}
            onChange={handleLogoChange}
          />
          <ImageUploadField
            label="Signature du formateur"
            uploading={uploadingSig}
            previewUrl={signatureUrl}
            onChange={handleSignatureChange}
          />
        </CardBody>
      </Card>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Annuler
        </Button>
        <Button type="submit" loading={saving}>
          {isEdit ? "Enregistrer les modifications" : "Créer la formation"}
        </Button>
      </div>
    </form>
  );
}

function ImageUploadField({
  label,
  uploading,
  previewUrl,
  onChange,
}: {
  label: string;
  uploading: boolean;
  previewUrl: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/30">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt={label}
            className="h-16 max-w-full object-contain"
          />
        ) : (
          <UploadCloud className="h-6 w-6 text-gray-400" />
        )}
        <span className="text-xs text-gray-500">
          {uploading ? (
            "Envoi en cours…"
          ) : previewUrl ? (
            <span className="flex items-center gap-1 text-green-600">
              <Check className="h-3.5 w-3.5" /> Image ajoutée — cliquez pour changer
            </span>
          ) : (
            "PNG ou JPG, cliquez pour choisir"
          )}
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={onChange}
        />
      </label>
    </div>
  );
}
