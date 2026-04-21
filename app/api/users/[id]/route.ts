import { NextRequest, NextResponse } from "next/server";
import { readUsers, writeUsers } from "@/lib/data";
import { decodeSession, getSessionCookieName } from "@/lib/session";

function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(getSessionCookieName());
  if (!cookie) return null;
  const user = decodeSession(cookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const data = readUsers();
  const idx = data.users.findIndex((u) => u.id === params.id);

  if (idx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  data.users[idx] = {
    ...data.users[idx],
    ...body,
    id: params.id, // prevent ID change
  };

  writeUsers(data);
  const { password: _p, ...safe } = data.users[idx];
  return NextResponse.json({ user: safe });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = readUsers();
  const idx = data.users.findIndex((u) => u.id === params.id);

  if (idx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Prevent deleting the last admin
  const user = data.users[idx];
  if (user.role === "admin") {
    const adminCount = data.users.filter((u) => u.role === "admin").length;
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last admin" },
        { status: 400 }
      );
    }
  }

  data.users.splice(idx, 1);
  writeUsers(data);
  return NextResponse.json({ success: true });
}
