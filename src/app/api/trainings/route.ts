import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trainings")
    .select("*, participants(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trainings: data });
}

export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const {
    title,
    description,
    organizer,
    trainer,
    location,
    start_date,
    end_date,
    trainer_signature_url,
    organizer_logo_url,
    accent_color,
  } = body;

  if (!title || !organizer || !trainer || !start_date || !end_date) {
    return NextResponse.json(
      { error: "Champs obligatoires manquants (titre, organisateur, formateur, dates)." },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("trainings")
    .insert({
      title,
      description: description || null,
      organizer,
      trainer,
      location: location || null,
      start_date,
      end_date,
      trainer_signature_url: trainer_signature_url || null,
      organizer_logo_url: organizer_logo_url || null,
      accent_color: accent_color || "#2557eb",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ training: data }, { status: 201 });
}
