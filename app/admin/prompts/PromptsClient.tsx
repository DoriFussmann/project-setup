"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";

interface Prompt {
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

export default function PromptsClient({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveConfig(updated: Prompt[]) {
    const res = await fetch("/api/config");
    const config = await res.json();
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, prompts: updated }),
    });
  }

  function startAdd() {
    setForm({ ...EMPTY_FORM });
    setAdding(true);
    setEditing(null);
    setError("");
  }

  function startEdit(p: Prompt) {
    setForm({
      name: p.name,
      description: p.description,
      systemPrompt: p.systemPrompt,
      userPromptTemplate: p.userPromptTemplate,
      inputPlaceholder: p.inputPlaceholder,
    });
    setEditing(p.id);
    setAdding(false);
    setExpanded(null);
    setError("");
  }

  function cancel() {
    setAdding(false);
    setEditing(null);
    setError("");
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!form.systemPrompt.trim()) { setError("System prompt is required"); return; }
    setSaving(true);
    setError("");

    try {
      const now = new Date().toISOString();
      let updated: Prompt[];

      if (adding) {
        const newPrompt: Prompt = {
          id: `prompt-${Date.now()}`,
          ...form,
          createdAt: now,
          updatedAt: now,
        };
        updated = [...prompts, newPrompt];
      } else if (editing) {
        updated = prompts.map((p) =>
          p.id === editing ? { ...p, ...form, updatedAt: now } : p
        );
      } else {
        return;
      }

      await saveConfig(updated);
      setPrompts(updated);
      cancel();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this prompt? Any buttons using it will need to be reassigned.")) return;
    const updated = prompts.filter((p) => p.id !== id);
    await saveConfig(updated);
    setPrompts(updated);
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base text-foreground">Prompts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage AI prompts. Use <code className="text-xs bg-secondary px-1 py-0.5 rounded">{"{{input}}"}</code> in the template to inject user input.
          </p>
        </div>
        <button onClick={startAdd} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Prompt
        </button>
      </div>

      {adding && (
        <PromptForm
          form={form}
          setForm={setForm}
          onSave={handleSave}
          onCancel={cancel}
          saving={saving}
          error={error}
          isNew
        />
      )}

      <div className="space-y-2">
        {prompts.map((prompt) => (
          <div key={prompt.id}>
            {editing === prompt.id ? (
              <PromptForm
                form={form}
                setForm={setForm}
                onSave={handleSave}
                onCancel={cancel}
                saving={saving}
                error={error}
              />
            ) : (
              <div className="card overflow-hidden">
                <div className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{prompt.name}</p>
                    {prompt.description && (
                      <p className="text-xs text-muted-foreground truncate">{prompt.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setExpanded(expanded === prompt.id ? null : prompt.id)}
                      className="btn-ghost p-1.5"
                      title="Preview"
                    >
                      {expanded === prompt.id ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button onClick={() => startEdit(prompt)} className="btn-ghost p-1.5">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="btn-ghost p-1.5 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {expanded === prompt.id && (
                  <div className="border-t border-border bg-muted/40 p-4 space-y-3">
                    <div>
                      <p className="label mb-1.5">System Prompt</p>
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-sans bg-background border border-border rounded-md p-3 max-h-40 overflow-y-auto">
                        {prompt.systemPrompt}
                      </pre>
                    </div>
                    <div>
                      <p className="label mb-1.5">User Template</p>
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-sans bg-background border border-border rounded-md p-3">
                        {prompt.userPromptTemplate}
                      </pre>
                    </div>
                    <div>
                      <p className="label mb-1.5">Input Placeholder</p>
                      <p className="text-xs text-muted-foreground italic">{prompt.inputPlaceholder}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {prompts.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No prompts yet. Add one above.
        </p>
      )}
    </div>
  );
}

function PromptForm({
  form,
  setForm,
  onSave,
  onCancel,
  saving,
  error,
  isNew,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
  isNew?: boolean;
}) {
  return (
    <div className="card p-4 mb-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="label">Name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Prospect Brief"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Description</label>
          <input
            className="input-field"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Short description"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="label">System Prompt</label>
        <textarea
          className="input-field resize-none min-h-[120px] font-mono text-xs"
          value={form.systemPrompt}
          onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
          placeholder="You are a sales assistant..."
        />
      </div>

      <div className="space-y-1.5">
        <label className="label">
          User Template{" "}
          <span className="text-muted-foreground normal-case font-normal">
            — use <code className="bg-secondary px-1 rounded">{"{{input}}"}</code> where user input goes
          </span>
        </label>
        <input
          className="input-field font-mono text-xs"
          value={form.userPromptTemplate}
          onChange={(e) => setForm((f) => ({ ...f, userPromptTemplate: e.target.value }))}
          placeholder="e.g. Generate a brief for: {{input}}"
        />
      </div>

      <div className="space-y-1.5">
        <label className="label">Input Placeholder</label>
        <input
          className="input-field"
          value={form.inputPlaceholder}
          onChange={(e) => setForm((f) => ({ ...f, inputPlaceholder: e.target.value }))}
          placeholder="e.g. Enter company name..."
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={onSave} disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : isNew ? "Create Prompt" : "Save Changes"}
        </button>
        <button onClick={onCancel} className="btn-ghost text-xs">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}
