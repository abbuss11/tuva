import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { generateCertificatePdf } from "@/lib/pdf/generateCertificate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: cert, error } = await supabase
    .from("certificate_details")
    .select("*")
    .eq("certificate_id", id)
    .maybeSingle();

  if (error || !cert) {
    return NextResponse.json(
      { error: "Attestation introuvable" },
      { status: 404 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tuva-tau.vercel.app/";
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
  });

  // Incrémente le compteur de téléchargements (best-effort)
  await supabase.rpc("increment_download_count", { cert_id: cert.certificate_id });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${cert.certificate_number}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
