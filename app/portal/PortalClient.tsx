"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  MessageSquare,
  Mail,
  LogOut,
  Loader2,
  ChevronRight,
  Sparkles,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  MessageSquare,
  Mail,
  Sparkles,
  Settings,
};

interface Button {
  id: string;
  label: string;
  icon: string;
  description: string;
  promptId: string;
  order: number;
}

interface Prompt {
  id: string;
  name: string;
  systemPrompt: string;
  userPromptTemplate: string;
  inputPlaceholder: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AppSettings {
  appName: string;
  logoText: string;
}

interface Props {
  user: User;
  buttons: Button[];
  prompts: Prompt[];
  appSettings: AppSettings;
}

export default function PortalClient({ user, buttons, prompts, appSettings }: Props) {
  const router = useRouter();
  const [activeButton, setActiveButton] = useState<Button | null>(
    buttons.length > 0 ? buttons[0] : null
  );
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sorted = [...buttons].sort((a, b) => a.order - b.order);

  const activePrompt = activeButton
    ? prompts.find((p) => p.id === activeButton.promptId)
    : null;

  function handleButtonClick(btn: Button) {
    setActiveButton(btn);
    setInput("");
    setResult("");
    setError("");
  }

  async function handleRun() {
    if (!input.trim() || !activeButton || !activePrompt) return;
    setLoading(true);
    setResult("");
    setError("");

    try {
      const res = await fetch("/api/ai/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: activeButton.promptId,
          userInput: input,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setResult(data.result);
    } catch {
      setError("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-sidebar-border bg-sidebar-background flex flex-col">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
              {appSettings.logoText}
            </div>
            <span className="text-sm text-sidebar-foreground">{appSettings.appName}</span>
          </div>
        </div>

        {/* Nav buttons */}
        <nav className="flex-1 p-3 space-y-0.5">
          {sorted.map((btn) => {
            const Icon = ICON_MAP[btn.icon] || Sparkles;
            const isActive = activeButton?.id === btn.id;
            return (
              <button
                key={btn.id}
                onClick={() => handleButtonClick(btn)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150 text-left",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{btn.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 opacity-50" />}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs text-secondary-foreground shrink-0">
              {user.name.charAt(0).toUpperCase()}
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
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-border flex items-center px-6">
          <div>
            <h1 className="text-sm text-foreground">
              {activeButton?.label || "Select a tool"}
            </h1>
            {activeButton?.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeButton.description}
              </p>
            )}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 flex flex-col gap-4 max-w-3xl w-full">
          {!activeButton ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Select a tool from the sidebar to get started.
              </p>
            </div>
          ) : (
            <>
              {/* Input */}
              <div className="space-y-2">
                <label className="label">
                  {activeButton.label}
                </label>
                <textarea
                  className="input-field resize-none min-h-[100px]"
                  placeholder={activePrompt?.inputPlaceholder || "Enter your input..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleRun();
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Press ⌘ + Enter to run
                </p>
              </div>

              <div>
                <button
                  onClick={handleRun}
                  disabled={loading || !input.trim()}
                  className="btn-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Run
                    </>
                  )}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-2">
                  <label className="label">Result</label>
                  <div className="card p-4">
                    <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                      {result}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
