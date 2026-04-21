import { NextRequest, NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/data";
import { decodeSession, getSessionCookieName } from "@/lib/session";

function requireAdmin(req: NextRequest) {
  const cookie = req.cookies.get(getSessionCookieName());
  if (!cookie) return null;
  const user = decodeSession(cookie.value);
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(getSessionCookieName());
  if (!cookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = decodeSession(cookie.value);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const config = readConfig();

  // Strip API keys for non-admins
  if (user.role !== "admin") {
    const safeConfig = { ...config };
    safeConfig.aiSettings = {
      ...config.aiSettings,
      anthropicApiKey: "",
      openaiApiKey: "",
    };
    return NextResponse.json(safeConfig);
  }

  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  writeConfig(body);
  return NextResponse.json({ success: true });
}
