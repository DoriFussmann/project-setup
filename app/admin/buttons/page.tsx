"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, GripVertical } from "lucide-react";

interface ButtonRecord {
  id: string;
  label: string;
  icon: string;
  description: string;
  promptId: string;
  order: number;
  active: boolean;
}

interface PromptRecord {
  id: string;
  name: string;
}

const ICONS = ["FileText", "MessageSquare", "Mail", "Search", "Star", "Zap", "Target", "TrendingUp", "Phone", "Calendar"];
const EMPTY_FORM = { label: "", icon: "FileText", description: "", promptId: "", active: true };

export default function ButtonsPage() {
  const [buttons, setButtons] = useState<ButtonRecord[]>([]);
  const [prompts, setPrompts] = useState<PromptRecord[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const d = await fetch("/api/config").then(r => r.json());
    setButtons((d.buttons || []).sort((a: ButtonRecord, b: ButtonRecord) => a.order - b.order));
    setPrompts(d.prompts || []);
  }

  async function saveConfig(updatedButtons: ButtonRecord[]) {
    const config = await fetch("/api/config").then(r => r.json());
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, buttons: updatedButtons }),
    });
  }

  function startAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function startEdit(b: ButtonRecord) {
    setEditing(b.id);
    setForm({ label: b.label, icon: b.icon, description: b.description, promptId: b.promptId, active: b.active });
    setShowForm(true);
    setError("");
  }

  function cancel() { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); setError(""); }

  async function save() {
    if (!form.label.trim()) { setError("Label is required"); return; }
    setSaving(true);
    try {
      let updated: ButtonRecord[];
      if (editing) {
        updated = buttons.map(b => b.id === editing ? { ...b, ...form } : b);
      } else {
        const newBtn: ButtonRecord = {
          id: `button-${Date.now()}`,
          ...form,
          order: buttons.length + 1,
        };
        updated = [...buttons, newBtn];
      }
      await saveConfig(updated);
      await load();
      cancel();
    } finally { setSaving(false); }
  }

  async function deleteButton(id: string) {
    if (!confirm("Delete this button? Users who have it in their permissions will lose access.")) return;
    const updated = buttons.filter(b => b.id !== id).map((b, i) => ({ ...b, order: i + 1 }));
    await saveConfig(updated);
    await load();
  }

  async function toggleActive(b: ButtonRecord) {
    const updated = buttons.map(btn => btn.id === b.id ? { ...btn, active: !btn.active } : btn);
    await saveConfig(updated);
    await load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg text-foreground mb-1">Buttons</h1>
          <p className="text-sm text-muted-foreground">These appear in the user portal sidebar</p>
        </div>
        <button onClick={startAdd} className="btn-primary">
          <Plus className="w-3.5 h-3.5" /> Add button
        </button>
      </div>

      {showForm && (
        <div className="card p-5 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-foreground">{editing ? "Edit button" : "New button"}</h2>
            <button onClick={cancel} className="p-1 rounded hover:bg-accent"><X className="w-4 h-4 text-muted-foreground" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Label</label>
                <input className="input-field" placeholder="Button label" value={form.label} onChange={e => setForm(f => ({...f, label: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <label className="label">Icon</label>
                <select className="input-field" value={form.icon} onChange={e => setForm(f => ({...f, icon: e.target.value}))}>
                  {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="label">Description</label>
              <input className="input-field" placeholder="Short description" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} />
            </div>
            <div className="space-y-1">
              <label className="label">Linked prompt</label>
              <select className="input-field" value={form.promptId} onChange={e => setForm(f => ({...f, promptId: e.target.value}))}>
                <option value="">— select a prompt —</option>
                {prompts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="btnactive" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} className="w-3.5 h-3.5" />
              <label htmlFor="btnactive" className="text-xs text-foreground">Active</label>
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
        {buttons.map(btn => (
          <div key={btn.id} className="card px-4 py-3 flex items-center gap-3">
            <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm text-foreground">{btn.label}</p>
                <span className="text-xs text-muted-foreground">· {btn.icon}</span>
              </div>
              {btn.description && <p className="text-xs text-muted-foreground truncate">{btn.description}</p>}
              {btn.promptId && (
                <p className="text-xs text-muted-foreground/60">
                  → {prompts.find(p => p.id === btn.promptId)?.name || "unknown prompt"}
                </p>
              )}
            </div>
            <button
              onClick={() => toggleActive(btn)}
              className={["text-xs px-2 py-0.5 rounded transition-colors", btn.active ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-muted text-muted-foreground hover:bg-accent"].join(" ")}
            >
              {btn.active ? "active" : "inactive"}
            </button>
            <div className="flex items-center gap-1">
              <button onClick={() => startEdit(btn)} className="p-1.5 rounded hover:bg-accent transition-colors">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => deleteButton(btn.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
        {buttons.length === 0 && (
          <p className="text-sm text-muted-foreground py-4">No buttons yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
