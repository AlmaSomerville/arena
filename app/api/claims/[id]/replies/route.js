import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import { applyFilters, applyOrder, parseFilters } from "@/lib/queryFilters";
import { UID_COOKIE } from "@/lib/identity";
import { cap } from "@/lib/text";

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
    .select("id, parent_claim_id")
    .eq("id", id)
    .maybeSingle();
  if (parentError) return NextResponse.json({ error: parentError.message }, { status: 500 });
  if (!parent) return NextResponse.json({ error: "That argument no longer exists." }, { status: 404 });
  if (parent.parent_claim_id) {
    return NextResponse.json({ error: "Replies can only be posted directly on a root argument." }, { status: 400 });
  }

  const { stance, title, references, mediaUrl, mediaType, mediaDurationSeconds } = body || {};

  if (!["for", "against", "nuance"].includes(stance)) {
    return NextResponse.json({ error: "Pick For, Against, or Nuance." }, { status: 400 });
  }
  if (!mediaUrl) {
    return NextResponse.json({ error: "A recording is required before posting." }, { status: 400 });
  }

  // Posting a For/Against response commits you to that team on the argument
  // (if you haven't picked one yet). Posting the opposite of a side you've
  // already locked in is rejected - Nuance never touches the side-lock.
  if (stance === "for" || stance === "against") {
    const { data: existingSide, error: sideLookupError } = await supabase
      .from("argument_sides")
      .select("*")
      .eq("claim_id", id)
      .eq("user_id", uid)
      .maybeSingle();
    if (sideLookupError) return NextResponse.json({ error: sideLookupError.message }, { status: 500 });

    if (existingSide && existingSide.side !== stance) {
      return NextResponse.json(
        { error: `You're on the ${existingSide.side === "for" ? "For" : "Against"} team for this argument. You can't post an ${stance === "for" ? "For" : "Against"} response.` },
        { status: 409 }
      );
    }
    if (!existingSide) {
      const { error: sideInsertError } = await supabase
        .from("argument_sides")
        .insert({ claim_id: id, user_id: uid, side: stance });
      if (sideInsertError) return NextResponse.json({ error: sideInsertError.message }, { status: 500 });
    }
  }

  const trimmedTitle = (title || "").trim();
  const finalTitle = trimmedTitle ? cap(trimmedTitle) : null;

  const { data: reply, error } = await supabase
    .from("claims")
    .insert({
      user_id: uid,
      parent_claim_id: id,
      stance,
      title: finalTitle,
      arena_name: finalTitle || (stance === "nuance" ? "A nuance" : stance === "for" ? "A For response" : "An Against response"),
      display_text: finalTitle || "",
      subject_a: finalTitle || "response", // kept populated for backward-compat with the not-null legacy column
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
      .map((r) => ({ claim_id: reply.id, url: r.url.trim(), label: (r.label || "").trim() || null }));
    if (rows.length) await supabase.from("claim_references").insert(rows);
  }

  return NextResponse.json({ claim: reply });
}
