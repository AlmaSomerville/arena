import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import { applyFilters, applyOrder, parseFilters } from "@/lib/queryFilters";
import { UID_COOKIE } from "@/lib/identity";
import { cap } from "@/lib/text";

const CLAIM_SELECT =
  "*, users:user_id ( nickname, avatar_color ), claim_references ( id, url, label ), votes ( value, user_id ), argument_sides ( side, user_id ), topics:topic_id ( slug, label )";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const orderKey = searchParams.get("order") || "newest";
  const filters = parseFilters(searchParams);
  // Comma-separated topic slugs the viewer said they're into. We don't hide
  // anything outside them (a small, early user base can't afford a filtered
  // feed going empty) - matching claims are just moved to the front,
  // preserving the chosen sort order within each group.
  const preferred = (searchParams.get("preferred") || "").split(",").map((s) => s.trim()).filter(Boolean);

  const supabase = getServiceClient();
  let query = supabase.from("claims").select(CLAIM_SELECT).is("parent_claim_id", null);
  query = applyFilters(query, filters);
  query = applyOrder(query, orderKey);

  const { data, error } = await query.limit(300);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let claims = data;
  if (preferred.length) {
    const match = [];
    const rest = [];
    for (const c of claims) {
      (preferred.includes(c.topics?.slug) ? match : rest).push(c);
    }
    claims = [...match, ...rest];
  }

  return NextResponse.json({ claims });
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
    title,
    topicId,
    references,
    mediaUrl,
    mediaType,
    mediaDurationSeconds,
    claimType,
    subjectA,
    subjectB,
    direction,
    dimension,
    scope,
    timeframe,
    caveats,
  } = body || {};

  const trimmedTitle = (title || "").trim();
  if (trimmedTitle.length < 6) {
    return NextResponse.json({ error: "Give it a few more words so people know what they're watching." }, { status: 400 });
  }
  if (!topicId) {
    return NextResponse.json({ error: "Pick a topic for this argument." }, { status: 400 });
  }
  if (!mediaUrl) {
    return NextResponse.json({ error: "A recording is required before posting." }, { status: 400 });
  }

  const finalTitle = cap(trimmedTitle);

  const supabase = getServiceClient();
  const { data: claim, error } = await supabase
    .from("claims")
    .insert({
      user_id: uid,
      topic_id: topicId,
      title: finalTitle,
      arena_name: finalTitle,
      display_text: finalTitle,
      // The guided wizard's structured answers, kept alongside the composed
      // title so a breakdown can be shown on the claim page. All optional,
      // since not every future posting path may go through the wizard.
      subject_a: (subjectA || "").trim() || finalTitle, // kept populated for backward-compat with the not-null legacy column
      subject_b: (subjectB || "").trim() || null,
      claim_type: claimType || null,
      direction: direction || null,
      dimension: (dimension || "").trim() || null,
      scope: (scope || "").trim() || null,
      timeframe: (timeframe || "").trim() || null,
      caveats: Array.isArray(caveats) ? caveats : [],
      media_url: mediaUrl,
      media_type: mediaType || "video",
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
