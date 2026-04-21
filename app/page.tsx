import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { decodeSession, getSessionCookieName } from "@/lib/session";

export default function Home() {
  const cookieStore = cookies();
  const cookie = cookieStore.get(getSessionCookieName());

  if (cookie) {
    const user = decodeSession(cookie.value);
    if (user) {
      if (user.role === "admin") redirect("/admin");
      else redirect("/portal");
    }
  }

  redirect("/login");
}
