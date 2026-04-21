// Simple session management via cookies (no external deps)
// For production handoff: replace with NextAuth or proper JWT

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  permissions: string[];
}

export function getSessionCookieName() {
  return "sp_session";
}

export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

export function decodeSession(token: string): SessionUser | null {
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}
