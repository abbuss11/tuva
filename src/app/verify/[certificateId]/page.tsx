import { createAdminClient } from "@/lib/supabase/server";
import { formatDateRange } from "@/lib/utils";
import { XCircle, ShieldCheck, BadgeCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ certificateId: string }>;
}) {
  const { certificateId } = await params;
  const supabase = createAdminClient();

  const { data: cert } = await supabase
    .from("certificate_details")
    .select("*")
    .eq("verification_code", certificateId)
    .maybeSingle();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-4 py-16">
      <div className="absolute inset-0 bg-aurora" />
      <div className="absolute inset-0 bg-grid-slate bg-grid opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent)]" />

      <div className="relative z-10 mb-8 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-glow">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
        </div>
        <span className="text-lg font-bold text-white">TUVA</span>
      </div>

      <div className="relative z-10 w-full max-w-md animate-fade-up overflow-hidden rounded-2xl bg-white shadow-elevated">
        {cert ? (
          <>
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
            <div className="p-8">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/50">
                  <BadgeCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Attestation authentique
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Ce document a bien été délivré par TUVA
                </p>
              </div>
              <dl className="space-y-3 rounded-xl bg-gray-50 p-4 text-sm">
                <Row label="Participant" value={cert.full_name} />
                <Row label="Formation" value={cert.training_title} />
                <Row label="Organisateur" value={cert.organizer} />
                <Row
                  label="Date de délivrance"
                  value={formatDateRange(cert.start_date, cert.end_date)}
                />
                <Row label="Numéro d'attestation" value={cert.certificate_number} mono />
              </dl>
            </div>
          </>
        ) : (
          <>
            <div className="h-1.5 w-full bg-gradient-to-r from-red-400 to-red-600" />
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50/50">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Attestation invalide ou inexistante
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Aucun document ne correspond à ce code de vérification.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <p className="relative z-10 mt-6 text-center text-xs text-white/30">
        Vérification indépendante de l&apos;authenticité — TUVA
      </p>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-200/70 pb-2.5 last:border-0 last:pb-0">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className={`text-right font-medium text-gray-900 ${mono ? "font-mono tracking-wide" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
