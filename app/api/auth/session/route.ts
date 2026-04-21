import { NextRequest, NextResponse } from "next/server";
import { decodeSession, getSessionCookieName } from "@/lib/session";

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(getSessionCookieName());
  if (!cookie) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = decodeSession(cookie.value);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user });
}
