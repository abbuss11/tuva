import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { generateCertificateNumber, generateVerificationCode } from "@/lib/utils";
import { notifyCertificate } from "@/lib/notifications";

type CsvRow = {
  [key: string]: string;
};

function pick(row: CsvRow, keys: string[]): string | null {
  for (const key of keys) {
    const found = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === key
    );
    if (found && row[found]?.trim()) return row[found].trim();
  }
  return null;
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const formData = await request.formData();
  const trainingId = formData.get("training_id");
  const file = formData.get("file");

  if (!trainingId || typeof trainingId !== "string") {
    return NextResponse.json({ error: "training_id manquant." }, { status: 400 });
  }
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier CSV manquant." }, { status: 400 });
  }

  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    return NextResponse.json(
      { error: `Erreur de lecture du CSV : ${parsed.errors[0].message}` },
      { status: 400 }
    );
  }

  const rows = parsed.data
    .map((row) => ({
      full_name: pick(row, ["nom complet", "full_name", "nom", "name"]),
      phone: pick(row, ["téléphone", "telephone", "phone"]),
      email: pick(row, ["email", "e-mail", "mail"]),
    }))
    .filter((r) => r.full_name);

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Aucune ligne valide trouvée. Vérifiez la colonne 'Nom complet'." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  let created = 0;
  const failures: string[] = [];

  for (const row of rows) {
    const { data: participant, error: pErr } = await supabase
      .from("participants")
      .insert({
        training_id: trainingId,
        full_name: row.full_name,
        phone: row.phone,
        email: row.email,
      })
      .select()
      .single();

    if (pErr || !participant) {
      failures.push(row.full_name || "?");
      continue;
    }

    let certOk = false;
    for (let attempt = 0; attempt < 5 && !certOk; attempt++) {
      const { error: cErr } = await supabase.from("certificates").insert({
        participant_id: participant.id,
        certificate_number: generateCertificateNumber(),
        verification_code: generateVerificationCode(),
      });
      if (!cErr) certOk = true;
    }

    if (!certOk) failures.push(row.full_name || "?");
    else {
      created += 1;
      const { data: certificate } = await supabase
        .from("certificates")
        .select("id, certificate_number")
        .eq("participant_id", participant.id)
        .single();
      if (certificate) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tuva-tau.vercel.app";
        await notifyCertificate({
          fullName: participant.full_name,
          email: participant.email,
          phone: participant.phone,
          certificateNumber: certificate.certificate_number,
          certificateUrl: `${siteUrl}/api/certificates/${certificate.id}/pdf`,
        });
      }
    }
  }

  return NextResponse.json({
    total: rows.length,
    created,
    failed: failures.length,
    failures,
  });
}
