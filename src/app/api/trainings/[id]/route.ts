import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: training, error: trainingError } = await supabase
    .from("trainings")
    .select("*")
    .eq("id", id)
    .single();

  if (trainingError || !training) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }

  const { data: participants, error: participantsError } = await supabase
    .from("participants")
    .select("*, certificates(*)")
    .eq("training_id", id)
    .order("created_at", { ascending: false });

  if (participantsError) {
    return NextResponse.json({ error: participantsError.message }, { status: 500 });
  }

  return NextResponse.json({ training, participants });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const supabase = createAdminClient();

  const allowedFields = [
    "title",
    "description",
    "organizer",
    "trainer",
    "location",
    "start_date",
    "end_date",
    "trainer_signature_url",
    "organizer_logo_url",
    "accent_color",
  ];
  const updates: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) updates[field] = body[field];
  }

  const { data, error } = await supabase
    .from("trainings")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ training: data });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const supabase = createAdminClient();
  const { error } = await supabase.from("trainings").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
