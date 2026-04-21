"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Zap, LayoutGrid, Settings, ArrowRight } from "lucide-react";

export default function AdminOverview() {
  const [config, setConfig] = useState<{ buttons: unknown[]; prompts: unknown[] } | null>(null);
  const [users, setUsers] = useState<unknown[]>([]);

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(setConfig);
    fetch("/api/users").then(r => r.json()).then(d => setUsers(d.users || []));
  }, []);

  const cards = [
    { label: "Users", value: users.length, href: "/admin/users", icon: Users, desc: "Manage access" },
    { label: "Buttons", value: config?.buttons.length ?? 0, href: "/admin/buttons", icon: LayoutGrid, desc: "Portal tools" },
    { label: "Prompts", value: config?.prompts.length ?? 0, href: "/admin/prompts", icon: Zap, desc: "AI prompts" },
    { label: "AI Settings", value: null, href: "/admin/settings", icon: Settings, desc: "Keys & models" },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-lg text-foreground mb-1">Overview</h1>
        <p className="text-sm text-muted-foreground">Manage your sales portal</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="card p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-md bg-muted">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
              {card.value !== null && (
                <p className="text-2xl text-foreground mb-1">{card.value}</p>
              )}
              <p className="text-xs text-muted-foreground">{card.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
