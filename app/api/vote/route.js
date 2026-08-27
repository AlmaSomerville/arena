import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import { UID_COOKIE } from "@/lib/identity";

export async function POST(req) {
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) {
    return NextResponse.json({ error: "Pick a nickname before voting." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { claimId, value } = body || {};
  if (!claimId || (value !== 1 && value !== -1)) {
    return NextResponse.json({ error: "Invalid vote." }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { data: claim, error: claimLookupError } = await supabase
    .from("claims")
    .select("id, parent_claim_id, stance")
    .eq("id", claimId)
    .maybeSingle();
  if (claimLookupError) return NextResponse.json({ error: claimLookupError.message }, { status: 500 });
  if (!claim) return NextResponse.json({ error: "That argument no longer exists." }, { status: 404 });

  // Root arguments themselves aren't voted on - you pick a side (For /
  // Against) instead, via /api/argument-sides.
  if (!claim.parent_claim_id) {
    return NextResponse.json(
      { error: "Root arguments aren't voted on directly. Pick a side instead." },
      { status: 400 }
    );
  }

  // Nuance responses are exempt from the side-lock and votable by anyone.
  // For/Against responses can only be voted on by someone who has locked in
  // the matching side on the root argument - this is the "numbing" rule
  // that stops malicious pile-on downvoting from the opposing side.
  if (claim.stance === "for" || claim.stance === "against") {
    const { data: mySide, error: sideError } = await supabase
      .from("argument_sides")
      .select("side")
      .eq("claim_id", claim.parent_claim_id)
      .eq("user_id", uid)
      .maybeSingle();
    if (sideError) return NextResponse.json({ error: sideError.message }, { status: 500 });

    if (!mySide) {
      return NextResponse.json(
        { error: "Pick a side on this argument before voting on its responses." },
        { status: 403 }
      );
    }
    if (mySide.side !== claim.stance) {
      return NextResponse.json(
        { error: `You're on the ${mySide.side === "for" ? "For" : "Against"} team. You can watch the ${claim.stance === "for" ? "For" : "Against"} side, but you can't vote on it.` },
        { status: 403 }
      );
    }
  }

  const { data: existing, error: lookupError } = await supabase
    .from("votes")
    .select("*")
    .eq("claim_id", claimId)
    .eq("user_id", uid)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });

  let myVote = value;
  if (!existing) {
    const { error } = await supabase.from("votes").insert({ claim_id: claimId, user_id: uid, value });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (existing.value === value) {
    const { error } = await supabase.from("votes").delete().eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    myVote = 0;
  } else {
    const { error } = await supabase
      .from("votes")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: updatedClaim, error: refetchError } = await supabase
    .from("claims")
    .select("id, score, upvotes, downvotes")
    .eq("id", claimId)
    .single();
  if (refetchError) return NextResponse.json({ error: refetchError.message }, { status: 500 });

  return NextResponse.json({ claim: updatedClaim, myVote });
}
