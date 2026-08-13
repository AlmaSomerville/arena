import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import { applyFilters, applyOrder, parseFilters } from "@/lib/queryFilters";
import { UID_COOKIE } from "@/lib/identity";
import { composeDisplayText } from "@/lib/claimWizard";
import { generateArenaName } from "@/lib/arenaNames";

const CLAIM_SELECT =
  "*, users:user_id ( nickname, avatar_color ), claim_references ( id, url, label ), votes ( value, user_id )";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderKey = searchParams.get("order") || "newest";
  const filters = parseFilters(searchParams);

  const supabase = getServiceClient();
  let query = supabase.from("claims").select(CLAIM_SELECT).is("parent_claim_id", null);
  query = applyFilters(query, filters);
  query = applyOrder(query, orderKey);

  const { data, error } = await query.limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ claims: data });
}

export async function POST(req) {
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) {
    return NextResponse.json({ error: "Pick a nickname before staking a claim." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    claimType,
    subjectA,
    subjectB,
    direction,
    dimension,
    scope,
    timeframe,
    caveats,
    displayText: displayTextOverride,
    references,
    mediaUrl,
    mediaType,
    mediaDurationSeconds,
  } = body || {};

  if (!claimType || !subjectA || !dimension || !scope) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!mediaUrl) {
    return NextResponse.json({ error: "A recording is required before posting." }, { status: 400 });
  }

  const displayText = displayTextOverride?.trim() || composeDisplayText(claimType, {
    subjectA,
    subjectB,
    direction,
    dimension,
    scope,
    timeframe,
    caveats: caveats || [],
  });
  const arenaName = generateArenaName({ claimType, subjectA, subjectB });

  const supabase = getServiceClient();
  const { data: claim, error } = await supabase
    .from("claims")
    .insert({
      user_id: uid,
      claim_type: claimType,
      subject_a: subjectA,
      subject_b: subjectB || null,
      direction: direction || null,
      dimension,
      scope,
      timeframe: timeframe || null,
      caveats: caveats || [],
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
      .map((r) => ({ claim_id: claim.id, url: r.url.trim(), label: (r.label || "").trim() || null }));
    if (rows.length) {
      const { error: refError } = await supabase.from("claim_references").insert(rows);
      if (refError) {
        return NextResponse.json({ claim, warning: refError.message });
      }
    }
  }

  return NextResponse.json({ claim });
}
