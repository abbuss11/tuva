import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const supabase = createAdminClient();

  const [
    { count: trainingsCount },
    { count: participantsCount },
    { count: certificatesCount },
    { data: downloadsData },
  ] = await Promise.all([
    supabase.from("trainings").select("*", { count: "exact", head: true }),
    supabase.from("participants").select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("*", { count: "exact", head: true }),
    supabase.from("certificates").select("download_count"),
  ]);

  const totalDownloads = (downloadsData || []).reduce(
    (sum, row) => sum + (row.download_count || 0),
    0
  );

  return NextResponse.json({
    trainingsCount: trainingsCount || 0,
    participantsCount: participantsCount || 0,
    certificatesCount: certificatesCount || 0,
    totalDownloads,
  });
}
