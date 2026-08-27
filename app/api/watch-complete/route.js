import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import { UID_COOKIE } from "@/lib/identity";

// Fired once a video has actually played through to the end (no
// forward-scrubbing allowed on the way there — that's enforced client-side
// by the player). One point of Rep per unique video, ever — replaying the
// same video doesn't farm more points, thanks to the unique(user_id,
// claim_id) constraint on video_watches, which we lean on here instead of
// re-checking in application code.
export async function POST(req) {
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) {
    return NextResponse.json({ error: "Pick a nickname first." }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { claimId } = body || {};
  if (!claimId) {
    return NextResponse.json({ error: "claimId is required." }, { status: 400 });
  }

  const supabase = getServiceClient();

  const { error: insertError } = await supabase
    .from("video_watches")
    .insert({ user_id: uid, claim_id: claimId })
    .select()
    .maybeSingle();
  // A duplicate watch (unique_violation, code 23505) just means they've
  // already gotten credit for this one — not an error worth surfacing.
  if (insertError && insertError.code !== "23505") {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, rep")
    .eq("id", uid)
    .maybeSingle();
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  return NextResponse.json({ rep: user?.rep ?? 0 });
}
