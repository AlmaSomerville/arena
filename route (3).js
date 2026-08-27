import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

// Fire-and-forget view tracking. The client only calls this once per claim
// per browser session (see components/ViewTracker.js), so "most watched" is
// a reasonable proxy for interest rather than a raw hit counter.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { claimId } = body || {};
  if (!claimId) return NextResponse.json({ error: "Missing claimId." }, { status: 400 });

  const supabase = getServiceClient();
  const { error } = await supabase.rpc("increment_view_count", { p_claim_id: claimId });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
