import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  generateCertificateNumber,
  generateVerificationCode,
} from "@/lib/utils";
import { notifyCertificate } from "@/lib/notifications";

type TrainingLookup = {
  id: string;
  title: string;
  registration_token: string;
};

async function findTraining(token: string): Promise<TrainingLookup | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("trainings")
    .select("id, title, registration_token")
    .eq("registration_token", token)
    .maybeSingle();
  return data;
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  const token = request.nextUrl.searchParams.get("token")?.trim();
  if (!token) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });

  const training = await findTraining(token);
  if (!training) return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  return NextResponse.json({ training: { title: training.title } });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token || "").trim();
    const fullName = String(body.full_name || "").trim();
    const email = String(body.email || "").trim() || null;
    const phone = String(body.phone || "").trim() || null;

    if (!token || !fullName || (!email && !phone)) {
      return NextResponse.json(
        { error: "Nom complet et email ou téléphone requis." },
        { status: 400 },
      );
    }

    const training = await findTraining(token);
    if (!training) {
      return NextResponse.json({ error: "Lien d'inscription invalide." }, { status: 404 });
    }

    const supabase = createAdminClient();
    const { data: participant, error: participantError } = await supabase
      .from("participants")
      .insert({
        training_id: training.id,
        full_name: fullName,
        phone,
        email,
      })
      .select()
      .single();

    if (participantError || !participant) {
      return NextResponse.json({ error: "Impossible d'enregistrer vos informations." }, { status: 500 });
    }

    let certificate = null;
    for (let attempt = 0; attempt < 5 && !certificate; attempt += 1) {
      const { data, error } = await supabase
        .from("certificates")
        .insert({
          participant_id: participant.id,
          certificate_number: generateCertificateNumber(),
          verification_code: generateVerificationCode(),
        })
        .select()
        .single();
      if (data) certificate = data;
      if (error && attempt === 4) {
        await supabase.from("participants").delete().eq("id", participant.id);
      }
    }

    if (!certificate) {
      return NextResponse.json({ error: "Impossible de générer votre attestation." }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tuva-tau.vercel.app";
    const certificateUrl = `${siteUrl}/api/certificates/${certificate.id}/pdf`;
    const notifications = await notifyCertificate({
      fullName,
      email,
      phone,
      certificateNumber: certificate.certificate_number,
      certificateUrl,
    });

    return NextResponse.json({
      certificateNumber: certificate.certificate_number,
      certificateUrl,
      notifications,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur lors de l'inscription." }, { status: 500 });
  }
}