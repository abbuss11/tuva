"use client";

import { use, useEffect, useState } from "react";
import { CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export default function ParticipantRegistrationPage({
  params,
}: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [trainingTitle, setTrainingTitle] = useState("la formation");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ certificateNumber: string; certificateUrl: string } | null>(null);

  useEffect(() => {
    fetch(`/api/participants/register?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data) => {
        if (data.training?.title) setTrainingTitle(data.training.title);
      });
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/participants/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, full_name: fullName, email, phone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Inscription impossible");
      setResult(data);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white sm:py-20">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="font-bold">TUVA</p>
            <p className="text-sm text-slate-400">Inscription participant</p>
          </div>
        </div>

        <Card className="border-white/10 bg-white/[0.06] text-white">
          <CardBody>
            {result ? (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h1 className="mt-4 text-2xl font-bold">Votre attestation est prête</h1>
                <p className="mt-2 text-sm text-slate-300">
                  Référence : <span className="font-mono">{result.certificateNumber}</span>
                </p>
                <a
                  href={result.certificateUrl}
                  className="mt-6 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-slate-900"
                >
                  Télécharger le PDF
                </a>
                <p className="mt-4 text-xs text-slate-400">
                  Le lien a aussi été envoyé par email ou SMS lorsque le service est configuré.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">{trainingTitle}</p>
                <h1 className="mt-2 text-2xl font-bold">Recevoir mon attestation</h1>
                <p className="mt-2 text-sm text-slate-300">Saisissez vos informations pour générer votre attestation de participation.</p>
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <Input label="Nom complet *" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
                  <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="vous@example.com" />
                  <Input label="Téléphone" type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+227 ..." />
                  <p className="text-xs text-slate-400">Indiquez au moins un email ou un téléphone.</p>
                  {error && <p className="text-sm text-red-300">{error}</p>}
                  <Button type="submit" className="w-full" loading={loading}>
                    <Send className="h-4 w-4" />
                    Générer mon attestation
                  </Button>
                </form>
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </main>
  );
}