import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeName } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { fullName, code } = await request.json();

    if (!fullName || !code) {
      return NextResponse.json(
        { error: "Nom complet et code requis" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Recherche par numéro d'attestation (insensible à la casse/espaces)
    const cleanCode = String(code).trim().toUpperCase();

    const { data, error } = await supabase
      .from("certificate_details")
      .select("*")
      .eq("certificate_number", cleanCode)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ certificate: null }, { status: 404 });
    }

    // Vérification du nom (comparaison normalisée pour tolérer accents/casse)
    if (normalizeName(data.full_name) !== normalizeName(fullName)) {
      return NextResponse.json({ certificate: null }, { status: 404 });
    }

    return NextResponse.json({ certificate: data });
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
