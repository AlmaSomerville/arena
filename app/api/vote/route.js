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

  const { data: claim, error: claimError } = await supabase
    .from("claims")
    .select("id, score, upvotes, downvotes")
    .eq("id", claimId)
    .single();
  if (claimError) return NextResponse.json({ error: claimError.message }, { status: 500 });

  return NextResponse.json({ claim, myVote });
}
