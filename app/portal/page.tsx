"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ChevronRight } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface Button {
  id: string;
  label: string;
  icon: string;
  description: string;
  promptId: string;
  order: number;
  active: boolean;
}

interface Prompt {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  inputPlaceholder: string;
}

interface Config {
  buttons: Button[];
  prompts: Prompt[];
  appSettings: { appName: string; logoText: string };
}

interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.push("/login"); return; }
        setUser(d.user);
      });

    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setConfig(d));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function handleRun() {
    if (!activeButton || !input.trim()) return;
    setLoading(true);
    setResult("");
    setAiError("");

    const btn = config?.buttons.find((b) => b.id === activeButton);
    if (!btn) return;

    try {
      const res = await fetch("/api/ai/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId: btn.promptId, userInput: input }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || "Something went wrong");
      } else {
        setResult(data.result);
      }
    } catch {
      setAiError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  function handleButtonClick(id: string) {
    setActiveButton(id);
    setInput("");
    setResult("");
    setAiError("");
  }

  if (!user || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const visibleButtons = config.buttons
    .filter((b) => b.active && user.permissions.includes(b.id))
    .sort((a, b) => a.order - b.order);

  const activeBtn = visibleButtons.find((b) => b.id === activeButton);
  const activePrompt = activeBtn
    ? config.prompts.find((p) => p.id === activeBtn.promptId)
    : null;

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-sidebar-background border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
              {config.appSettings.logoText}
            </div>
            <span className="text-sm text-sidebar-foreground">{config.appSettings.appName}</span>
          </div>
        </div>

        {/* Nav buttons */}
        <nav className="flex-1 p-3 space-y-1">
          {visibleButtons.map((btn) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const IconComponent = ((LucideIcons as unknown) as Record<string, React.ComponentType<{className?: string}>>)[btn.icon] || LucideIcons.Circle;
            const isActive = activeButton === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => handleButtonClick(btn.id)}
                className={[
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                ].join(" ")}
              >
                <IconComponent className="w-4 h-4 shrink-0 opacity-70" />
                <span className="flex-1 text-left">{btn.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-40" />}
              </button>
            );
          })}

          {visibleButtons.length === 0 && (
            <p className="text-xs text-muted-foreground px-3 py-2">No tools available</p>
          )}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground shrink-0">
              {user.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1 rounded hover:bg-sidebar-accent transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center px-6">
          <div>
            <h1 className="text-sm text-foreground">
              {activeBtn ? activeBtn.label : "Select a tool"}
            </h1>
            {activeBtn && (
              <p className="text-xs text-muted-foreground">{activeBtn.description}</p>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-6">
          {!activeButton && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Choose a tool from the left panel</p>
              </div>
            </div>
          )}

          {activeButton && (
            <div className="max-w-2xl space-y-4">
              {/* Input */}
              <div className="space-y-1.5">
                <label className="label">Input</label>
                <textarea
                  className="input-field min-h-[100px] resize-none"
                  placeholder={activePrompt?.inputPlaceholder || "Enter your input..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>

              <button
                onClick={handleRun}
                disabled={loading || !input.trim()}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Run"
                )}
              </button>

              {aiError && (
                <p className="text-xs text-destructive">{aiError}</p>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-1.5">
                  <label className="label">Result</label>
                  <div className="card p-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {result}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
