"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const ANTHROPIC_MODELS = [
  "claude-opus-4-5",
  "claude-sonnet-4-5",
  "claude-haiku-4-5-20251001",
];

const OPENAI_MODELS = [
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
];

interface AiSettings {
  provider: string;
  anthropicModel: string;
  openaiModel: string;
}

interface AppSettings {
  appName: string;
  logoText: string;
}

export default function SettingsPage() {
  const [aiSettings, setAiSettings] = useState<AiSettings>({
    provider: "anthropic",
    anthropicModel: "claude-opus-4-5",
    openaiModel: "gpt-4o",
  });
  const [appSettings, setAppSettings] = useState<AppSettings>({ appName: "Sales Portal", logoText: "SP" });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/config").then(r => r.json()).then(d => {
      if (d.aiSettings) setAiSettings(d.aiSettings);
      if (d.appSettings) setAppSettings(d.appSettings);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    const config = await fetch("/api/config").then(r => r.json());
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, aiSettings, appSettings }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-lg text-foreground mb-1">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure AI providers and app settings</p>
      </div>

      <div className="max-w-lg space-y-6">
        {/* App settings */}
        <div className="card p-5">
          <h2 className="text-sm text-foreground mb-4">App</h2>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">App name</label>
                <input
                  className="input-field"
                  value={appSettings.appName}
                  onChange={e => setAppSettings(s => ({...s, appName: e.target.value}))}
                />
              </div>
              <div className="space-y-1">
                <label className="label">Logo text (2 chars)</label>
                <input
                  className="input-field"
                  maxLength={2}
                  value={appSettings.logoText}
                  onChange={e => setAppSettings(s => ({...s, logoText: e.target.value}))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* AI Provider */}
        <div className="card p-5">
          <h2 className="text-sm text-foreground mb-4">AI Provider</h2>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="label">Active provider</label>
              <div className="flex gap-2">
                {["anthropic", "openai"].map(p => (
                  <button
                    key={p}
                    onClick={() => setAiSettings(s => ({...s, provider: p}))}
                    className={[
                      "px-3 py-1.5 rounded-md text-sm transition-all",
                      aiSettings.provider === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground hover:bg-accent",
                    ].join(" ")}
                  >
                    {p === "anthropic" ? "Anthropic" : "OpenAI"}
                  </button>
                ))}
              </div>
            </div>

            {/* Anthropic */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-normal">Anthropic</p>
              <div className="space-y-1">
                <label className="label">Model</label>
                <select
                  className="input-field"
                  value={aiSettings.anthropicModel}
                  onChange={e => setAiSettings(s => ({...s, anthropicModel: e.target.value}))}
                >
                  {ANTHROPIC_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>

            {/* OpenAI */}
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-normal">OpenAI</p>
              <div className="space-y-1">
                <label className="label">Model</label>
                <select
                  className="input-field"
                  value={aiSettings.openaiModel}
                  onChange={e => setAiSettings(s => ({...s, openaiModel: e.target.value}))}
                >
                  {OPENAI_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : saving ? "Saving..." : "Save settings"}
        </button>
      </div>
    </div>
  );
}
