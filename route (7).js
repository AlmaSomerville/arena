import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

const CLAIM_SELECT =
  "*, users:user_id ( nickname, avatar_color ), claim_references ( id, url, label ), votes ( value, user_id ), argument_sides ( side, user_id ), topics:topic_id ( slug, label )";

export async function GET(_req, { params }) {
  const { id } = await params;
  const supabase = getServiceClient();
  const { data, error } = await supabase.from("claims").select(CLAIM_SELECT).eq("id", id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Claim not found." }, { status: 404 });
  return NextResponse.json({ claim: data });
}
