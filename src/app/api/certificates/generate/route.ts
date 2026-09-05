import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { generateCertificatePdf } from "@/lib/pdf/generateCertificate";

/**
 * Génère (ou régénère) le PDF d'une attestation et l'enregistre
 * dans Supabase Storage. Utile après modification d'une formation
 * (logo/signature changés) pour rafraîchir le PDF mis en cache.
 * Le téléchargement public (/api/certificates/[id]/pdf) génère de
 * toute façon le PDF à la volée, donc cette route est optionnelle
 * mais permet de pré-générer et stocker une copie durable.
 */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { certificate_id } = await request.json();
  if (!certificate_id) {
    return NextResponse.json({ error: "certificate_id requis" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: cert, error } = await supabase
    .from("certificate_details")
    .select("*")
    .eq("certificate_id", certificate_id)
    .maybeSingle();

  if (error || !cert) {
    return NextResponse.json({ error: "Attestation introuvable" }, { status: 404 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tuva-tau.vercel.app";
  const verificationUrl = `${siteUrl}/verify/${cert.verification_code}`;

  const pdfBytes = await generateCertificatePdf({
    participantName: cert.full_name,
    trainingTitle: cert.training_title,
    organizer: cert.organizer,
    trainer: cert.trainer,
    location: cert.location,
    startDate: cert.start_date,
    endDate: cert.end_date,
    certificateNumber: cert.certificate_number,
    verificationUrl,
    organizerLogoUrl: cert.organizer_logo_url,
    trainerSignatureUrl: cert.trainer_signature_url,
    accentColor: cert.accent_color,
  });

  const path = `${cert.certificate_number}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from("certificates")
    .upload(path, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("certificates").getPublicUrl(path);

  await supabase
    .from("certificates")
    .update({ pdf_url: publicUrl })
    .eq("id", certificate_id);

  return NextResponse.json({ pdf_url: publicUrl });
}
