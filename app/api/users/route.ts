import { NextRequest, NextResponse } from "next/server";
import { readUsers, writeUsers, User } from "@/lib/data";
import { decodeSession, getSessionCookieName } from "@/lib/session";

function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(getSessionCookieName());
  if (!cookie) return null;
  const user = decodeSession(cookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = readUsers();
  // Never return passwords to client
  const safe = data.users.map(({ password: _p, ...u }) => u);
  return NextResponse.json({ users: safe });
}

export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = readUsers();

  const exists = data.users.find((u) => u.email === body.email);
  if (exists) {
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });
  }

  const newUser: User = {
    id: `user-${Date.now()}`,
    email: body.email,
    password: body.password,
    name: body.name,
    role: body.role || "user",
    active: true,
    permissions: body.permissions || [],
  };

  data.users.push(newUser);
  writeUsers(data);

  const { password: _p, ...safe } = newUser;
  return NextResponse.json({ user: safe });
}
