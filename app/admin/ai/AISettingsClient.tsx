"use client";

import { useState } from "react";
import { Check, Eye, EyeOff } from "lucide-react";

const ANTHROPIC_MODELS = [
  { value: "claude-opus-4-5", label: "Claude Opus 4.5 (Most capable)" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5 (Balanced)" },
  { value: "claude-haiku-4-5", label: "Claude Haiku (Fastest)" },
];

const OPENAI_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (Most capable)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (Faster)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
];

interface AISettings {
  provider: "anthropic" | "openai";
  anthropicModel: string;
  openaiModel: string;
  anthropicApiKey: string;
  openaiApiKey: string;
}

export default function AISettingsClient({ initialSettings }: { initialSettings: AISettings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);

    const res = await fetch("/api/config");
    const config = await res.json();

    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, aiSettings: settings }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const models = settings.provider === "anthropic" ? ANTHROPIC_MODELS : OPENAI_MODELS;
  const currentModel =
    settings.provider === "anthropic" ? settings.anthropicModel : settings.openaiModel;

  function setModel(val: string) {
    if (settings.provider === "anthropic") {
      setSettings((s) => ({ ...s, anthropicModel: val }));
    } else {
      setSettings((s) => ({ ...s, openaiModel: val }));
    }
  }

  return (
    <div className="p-6 max-w-xl">
      <div className="mb-6">
        <h1 className="text-base text-foreground">AI Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure the AI provider, model, and API keys
        </p>
      </div>

      <div className="card p-5 space-y-5">
        {/* Provider */}
        <div className="space-y-2">
          <label className="label">Provider</label>
          <div className="grid grid-cols-2 gap-2">
            {(["anthropic", "openai"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setSettings((s) => ({ ...s, provider: p }))}
                className={`px-4 py-2.5 rounded-md border text-sm transition-all ${
                  settings.provider === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-secondary"
                }`}
              >
                {p === "anthropic" ? "Anthropic" : "OpenAI"}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div className="space-y-1.5">
          <label className="label">Model</label>
          <select
            className="input-field"
            value={currentModel}
            onChange={(e) => setModel(e.target.value)}
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Anthropic API Key */}
        <div className="space-y-1.5">
          <label className="label">Anthropic API Key</label>
          <div className="relative">
            <input
              className="input-field pr-10"
              type={showAnthropicKey ? "text" : "password"}
              value={settings.anthropicApiKey}
              onChange={(e) =>
                setSettings((s) => ({ ...s, anthropicApiKey: e.target.value }))
              }
              placeholder="sk-ant-..."
            />
            <button
              type="button"
              onClick={() => setShowAnthropicKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showAnthropicKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* OpenAI API Key */}
        <div className="space-y-1.5">
          <label className="label">OpenAI API Key</label>
          <div className="relative">
            <input
              className="input-field pr-10"
              type={showOpenAIKey ? "text" : "password"}
              value={settings.openaiApiKey}
              onChange={(e) =>
                setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))
              }
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowOpenAIKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showOpenAIKey ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          API keys are stored in <code className="bg-secondary px-1 rounded">data/config.json</code> and
          never exposed to non-admin users.
        </p>

        <button onClick={handleSave} disabled={saving} className="btn-primary text-xs">
          {saved ? (
            <>
              <Check className="w-3.5 h-3.5" /> Saved
            </>
          ) : saving ? (
            "Saving..."
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
