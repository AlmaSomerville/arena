import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import { UID_COOKIE } from "@/lib/identity";

// Picking a side on a root argument is a one-time, permanent commitment —
// it's what lets us "numb" (block) someone from voting on the responses
// belonging to the side they didn't pick, without hiding those responses
// from view. Nuance responses never touch this table.
export async function POST(req) {
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) {
    return NextResponse.json({ error: "Pick a nickname before choosing a side." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { claimId, side } = body || {};
  if (!claimId || !["for", "against"].includes(side)) {
    return NextResponse.json({ error: "Pick For or Against." }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, parent_claim_id, for_count, against_count")
    .eq("id", claimId)
    .maybeSingle();
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });
  if (!claim) return NextResponse.json({ error: "That argument no longer exists." }, { status: 404 });
  if (claim.parent_claim_id) {
    return NextResponse.json({ error: "You can only pick a side on a root argument." }, { status: 400 });
  }

  const { data: existing, error: lookupError } = await supabase
    .from("argument_sides")
    .select("*")
    .eq("claim_id", claimId)
    .eq("user_id", uid)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  if (existing && existing.side !== side) {
    return NextResponse.json(
      { error: `You already picked ${existing.side === "for" ? "For" : "Against"} on this argument — that choice is locked in.` },
      { status: 409 }
    );
  }

  if (!existing) {
    const { error: insertError } = await supabase
      .from("argument_sides")
      .insert({ claim_id: claimId, user_id: uid, side });
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: updated, error: refetchError } = await supabase
    .from("claims")
    .select("id, for_count, against_count")
    .eq("id", claimId)
    .single();
  if (refetchError) return NextResponse.json({ error: refetchError.message }, { status: 500 });

  return NextResponse.json({ claim: updated, mySide: side });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const claimId = searchParams.get("claimId");
  if (!claimId) return NextResponse.json({ error: "claimId is required." }, { status: 400 });

  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) return NextResponse.json({ mySide: null });

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("argument_sides")
    .select("side")
    .eq("claim_id", claimId)
    .eq("user_id", uid)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ mySide: data?.side || null });
}
