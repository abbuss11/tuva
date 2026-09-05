import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { generateCertificateNumber, generateVerificationCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const { training_id, full_name, phone, email } = body;

  if (!training_id || !full_name) {
    return NextResponse.json(
      { error: "training_id et full_name sont requis." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .insert({
      training_id,
      full_name: full_name.trim(),
      phone: phone || null,
      email: email || null,
    })
    .select()
    .single();

  if (participantError || !participant) {
    return NextResponse.json(
      { error: participantError?.message || "Erreur lors de la création." },
      { status: 500 }
    );
  }

  // Génère automatiquement un numéro d'attestation + code de vérification
  // uniques (avec quelques tentatives en cas de collision improbable).
  let certificate = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5 && !certificate; attempt++) {
    const { data, error } = await supabase
      .from("certificates")
      .insert({
        participant_id: participant.id,
        certificate_number: generateCertificateNumber(),
        verification_code: generateVerificationCode(),
      })
      .select()
      .single();

    if (data) {
      certificate = data;
    } else {
      lastError = error?.message || null;
    }
  }

  if (!certificate) {
    return NextResponse.json(
      { error: lastError || "Impossible de générer l'attestation." },
      { status: 500 }
    );
  }

  return NextResponse.json({ participant, certificate }, { status: 201 });
}
