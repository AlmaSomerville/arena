import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import { applyFilters, applyOrder, parseFilters } from "@/lib/queryFilters";
import { UID_COOKIE } from "@/lib/identity";
import { composeReplyText } from "@/lib/claimWizard";
import { generateReplyName } from "@/lib/arenaNames";

const CLAIM_SELECT =
  "*, users:user_id ( nickname, avatar_color ), claim_references ( id, url, label ), votes ( value, user_id )";

export async function GET(req, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const orderKey = searchParams.get("order") || "highest_voted";
  const filters = parseFilters(searchParams);

  const supabase = getServiceClient();
  let query = supabase.from("claims").select(CLAIM_SELECT).eq("parent_claim_id", id);
  query = applyFilters(query, filters);
  query = applyOrder(query, orderKey);

  const { data, error } = await query.limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claims: data });
}

export async function POST(req, { params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) {
    return NextResponse.json({ error: "Pick a nickname before replying." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: parent, error: parentError } = await supabase
    .from("claims")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (parentError) return NextResponse.json({ error: parentError.message }, { status: 500 });
  if (!parent) return NextResponse.json({ error: "That claim no longer exists." }, { status: 404 });

  const { stance, addresses, dimension, scope, caveats, references, mediaUrl, mediaType, mediaDurationSeconds } =
    body || {};

  if (!stance || !addresses || !dimension) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!mediaUrl) {
    return NextResponse.json({ error: "A recording is required before posting." }, { status: 400 });
  }

  const displayText = composeReplyText(parent, {
    stance,
    addresses,
    dimension,
    scope,
    caveats: caveats || [],
  });
  const arenaName = generateReplyName({ stance, subjectA: parent.subject_a, seed: id });

  const { data: reply, error } = await supabase
    .from("claims")
    .insert({
      user_id: uid,
      parent_claim_id: id,
      claim_type: parent.claim_type,
      subject_a: parent.subject_a,
      subject_b: parent.subject_b,
      direction: parent.direction,
      dimension,
      scope: scope || parent.scope,
      caveats: caveats || [],
      stance,
      addresses,
      arena_name: arenaName,
      display_text: displayText,
      media_url: mediaUrl,
      media_type: mediaType || "audio",
      media_duration_seconds: mediaDurationSeconds || null,
    })
    .select(CLAIM_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (Array.isArray(references) && references.length) {
    const rows = references
      .filter((r) => r.url && r.url.trim())
      .map((r) => ({ claim_id: reply.id, url: r.url.trim(), label: (r.label || "").trim() || null }));
    if (rows.length) await supabase.from("claim_references").insert(rows);
  }

  return NextResponse.json({ claim: reply });
}
