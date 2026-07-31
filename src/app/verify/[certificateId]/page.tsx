import { createAdminClient } from "@/lib/supabase/server";
import { formatDateRange } from "@/lib/utils";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <ShieldCheck className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">TUVA</span>
      </div>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
        {cert ? (
          <>
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-7 w-7 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                Attestation authentique
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Ce document a bien été délivré par TUVA
              </p>
            </div>
            <dl className="space-y-3 text-sm">
              <Row label="Participant" value={cert.full_name} />
              <Row label="Formation" value={cert.training_title} />
              <Row label="Organisateur" value={cert.organizer} />
              <Row
                label="Date de délivrance"
                value={formatDateRange(cert.start_date, cert.end_date)}
              />
              <Row label="Numéro d'attestation" value={cert.certificate_number} />
            </dl>
          </>
        ) : (
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-7 w-7 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">
              Attestation invalide ou inexistante
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Aucun document ne correspond à ce code de vérification.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-gray-100 pb-2 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-900">{value}</dd>
    </div>
  );
}
