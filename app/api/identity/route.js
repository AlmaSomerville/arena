import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServiceClient } from "@/lib/supabase";
import {
  pickAvatarColor,
  isValidNickname,
  UID_COOKIE,
  NICK_COOKIE,
  COOKIE_MAX_AGE,
} from "@/lib/identity";

export async function GET() {
  const cookieStore = await cookies();
  const uid = cookieStore.get(UID_COOKIE)?.value;
  if (!uid) return NextResponse.json({ user: null });

  const supabase = getServiceClient();
  const { data: user } = await supabase.from("users").select("*").eq("id", uid).maybeSingle();
  return NextResponse.json({ user: user || null });
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const nickname = (body?.nickname || "").trim();
  if (!isValidNickname(nickname)) {
    return NextResponse.json(
      { error: "Nicknames are 2-20 characters: letters, numbers, spaces, and - _ . '" },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("*")
    .ilike("nickname", nickname)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  let user = existing;
  if (!user) {
    const { data: created, error: insertError } = await supabase
      .from("users")
      .insert({ nickname, avatar_color: pickAvatarColor(nickname) })
      .select()
      .single();
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    user = created;
  }

  const res = NextResponse.json({ user });
  res.cookies.set(UID_COOKIE, user.id, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  res.cookies.set(NICK_COOKIE, user.nickname, {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });
  return res;
}
