"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, ChevronDown } from "lucide-react";

interface PromptRecord {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  userPromptTemplate: string;
  inputPlaceholder: string;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM = {
  name: "",
  description: "",
  systemPrompt: "",
  userPromptTemplate: "{{input}}",
  inputPlaceholder: "Enter your input...",
};

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const d = await fetch("/api/config").then(r => r.json());
    setPrompts(d.prompts || []);
  }

  async function saveConfig(updatedPrompts: PromptRecord[]) {
    const config = await fetch("/api/config").then(r => r.json());
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, prompts: updatedPrompts }),
    });
  }

  function startAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function startEdit(p: PromptRecord) {
    setEditing(p.id);
    setForm({ name: p.name, description: p.description, systemPrompt: p.systemPrompt, userPromptTemplate: p.userPromptTemplate, inputPlaceholder: p.inputPlaceholder });
    setShowForm(true);
    setError("");
  }

  function cancel() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setError(""); }

  async function save() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.systemPrompt.trim()) { setError("System prompt is required"); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      let updated: PromptRecord[];
      if (editing) {
        updated = prompts.map(p => p.id === editing ? { ...p, ...form, updatedAt: now } : p);
      } else {
        const newPrompt: PromptRecord = {
          id: `prompt-${Date.now()}`,
          ...form,
          createdAt: now,
          updatedAt: now,
        };
        updated = [...prompts, newPrompt];
      }
      await saveConfig(updated);
      await load();
      cancel();
    } finally { setSaving(false); }
  }

  async function deletePrompt(id: string) {
    if (!confirm("Delete this prompt? Any buttons linked to it will stop working.")) return;
    const updated = prompts.filter(p => p.id !== id);
    await saveConfig(updated);
    await load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg text-foreground mb-1">Prompts</h1>
          <p className="text-sm text-muted-foreground">AI prompts used by portal buttons. Use {"{{input}}"} as placeholder for user input.</p>
        </div>
        <button onClick={startAdd} className="btn-primary">
          <Plus className="w-3.5 h-3.5" /> Add prompt
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-foreground">{editing ? "Edit prompt" : "New prompt"}</h2>
            <button onClick={cancel} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Name</label>
                <input className="input-field" placeholder="Prompt name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <label className="label">Description</label>
                <input className="input-field" placeholder="Short description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="label">System prompt</label>
              <textarea
                className="input-field min-h-[120px] resize-none"
                placeholder="You are a... When given... respond with..."
                value={form.systemPrompt}
                onChange={e => setForm(f => ({...f, systemPrompt: e.target.value}))}
              />
            </div>
            <div className="space-y-1">
              <label className="label">User prompt template <span className="normal-case text-muted-foreground/60">(use {"{{input}}"} for user input)</span></label>
              <input className="input-field" placeholder="e.g. Generate a brief for: {{input}}" value={form.userPromptTemplate} onChange={e => setForm(f => ({...f, userPromptTemplate: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="label">Input placeholder text</label>
              <input className="input-field" placeholder="e.g. Enter company name..." value={form.inputPlaceholder} onChange={e => setForm(f => ({...f, inputPlaceholder: e.target.value}))} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={saving} className="btn-primary">
                <Check className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={cancel} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 max-w-2xl">
        {prompts.map(p => (
          <div key={p.id} className="card overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpanded(expanded === p.id ? null : p.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{p.name}</p>
                {p.description && <p className="text-xs text-muted-foreground truncate">{p.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); startEdit(p); }} className="p-1.5 rounded hover:bg-accent transition-colors">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button onClick={e => { e.stopPropagation(); deletePrompt(p.id); }} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <ChevronDown className={["w-4 h-4 text-muted-foreground transition-transform duration-200", expanded === p.id ? "rotate-180" : ""].join(" ")} />
              </div>
            </div>
            {expanded === p.id && (
              <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20 space-y-2">
                <div className="pt-3">
                  <p className="label mb-1">System prompt</p>
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">{p.systemPrompt}</pre>
                </div>
                <div>
                  <p className="label mb-1">User template</p>
                  <code className="text-xs text-muted-foreground">{p.userPromptTemplate}</code>
                </div>
                <div>
                  <p className="label mb-1">Input placeholder</p>
                  <p className="text-xs text-muted-foreground">{p.inputPlaceholder}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        {prompts.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No prompts yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
