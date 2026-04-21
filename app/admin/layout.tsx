"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Users, Settings, Zap, LayoutGrid, LogOut, ChevronRight } from "lucide-react";

interface SessionUser {
  id: string; name: string; email: string; role: string;
}

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/buttons", label: "Buttons", icon: LayoutGrid },
  { href: "/admin/prompts", label: "Prompts", icon: Zap },
  { href: "/admin/settings", label: "AI Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(d => {
        if (!d.user || d.user.role !== "admin") router.push("/login");
        else setUser(d.user);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 shrink-0 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
              A
            </div>
            <span className="text-sm text-sidebar-foreground">Admin</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/admin";
            const isActiveExact = item.exact && pathname === item.href;
            const active = isActiveExact || (!item.exact && isActive);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                ].join(" ")}
              >
                <Icon className="w-4 h-4 shrink-0 opacity-70" />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs shrink-0">
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-sidebar-foreground truncate">{user.name}</p>
            </div>
            <button onClick={handleLogout} className="p-1 rounded hover:bg-sidebar-accent transition-colors" title="Sign out">
              <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
