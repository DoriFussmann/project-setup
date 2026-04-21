"use client";

import { useState } from "react";
import {
  Plus, Pencil, Trash2, X, GripVertical,
  FileText, MessageSquare, Mail, Sparkles, Settings, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_OPTIONS = [
  { value: "FileText", label: "Document", Icon: FileText },
  { value: "MessageSquare", label: "Message", Icon: MessageSquare },
  { value: "Mail", label: "Mail", Icon: Mail },
  { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
  { value: "Settings", label: "Settings", Icon: Settings },
];

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
}

interface Props {
  initialButtons: Button[];
  prompts: Prompt[];
}

const EMPTY_FORM = {
  label: "",
  icon: "Sparkles",
  description: "",
  promptId: "",
  active: true,
};

export default function ButtonsClient({ initialButtons, prompts }: Props) {
  const [buttons, setButtons] = useState(
    [...initialButtons].sort((a, b) => a.order - b.order)
  );
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function saveConfig(updated: Button[]) {
    const res = await fetch("/api/config");
    const config = await res.json();
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...config, buttons: updated }),
    });
  }

  function startAdd() {
    setForm({ ...EMPTY_FORM, promptId: prompts[0]?.id || "" });
    setAdding(true);
    setEditing(null);
    setError("");
  }

  function startEdit(btn: Button) {
    setForm({
      label: btn.label,
      icon: btn.icon,
      description: btn.description,
      promptId: btn.promptId,
      active: btn.active,
    });
    setEditing(btn.id);
    setAdding(false);
    setError("");
  }

  function cancel() {
    setAdding(false);
    setEditing(null);
    setError("");
  }

  async function handleSave() {
    if (!form.label.trim()) { setError("Label is required"); return; }
    setSaving(true);
    setError("");

    try {
      let updated: Button[];

      if (adding) {
        const newBtn: Button = {
          id: `button-${Date.now()}`,
          ...form,
          order: buttons.length + 1,
        };
        updated = [...buttons, newBtn];
      } else if (editing) {
        updated = buttons.map((b) =>
          b.id === editing ? { ...b, ...form } : b
        );
      } else {
        return;
      }

      await saveConfig(updated);
      setButtons(updated);
      cancel();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this button?")) return;
    const updated = buttons.filter((b) => b.id !== id).map((b, i) => ({ ...b, order: i + 1 }));
    await saveConfig(updated);
    setButtons(updated);
  }

  async function toggleActive(id: string) {
    const updated = buttons.map((b) =>
      b.id === id ? { ...b, active: !b.active } : b
    );
    await saveConfig(updated);
    setButtons(updated);
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base text-foreground">Buttons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure the portal sidebar navigation
          </p>
        </div>
        <button onClick={startAdd} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Add Button
        </button>
      </div>

      {adding && (
        <ButtonForm
          form={form}
          setForm={setForm}
          prompts={prompts}
          onSave={handleSave}
          onCancel={cancel}
          saving={saving}
          error={error}
          isNew
        />
      )}

      <div className="space-y-2">
        {buttons.map((btn) => {
          const IconComp = ICON_OPTIONS.find((i) => i.value === btn.icon)?.Icon || Sparkles;

          return (
            <div key={btn.id}>
              {editing === btn.id ? (
                <ButtonForm
                  form={form}
                  setForm={setForm}
                  prompts={prompts}
                  onSave={handleSave}
                  onCancel={cancel}
                  saving={saving}
                  error={error}
                />
              ) : (
                <div className={cn("card p-4 flex items-center gap-3", !btn.active && "opacity-50")}>
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0 cursor-grab" />
                  <div className="w-7 h-7 rounded bg-secondary flex items-center justify-center shrink-0">
                    <IconComp className="w-3.5 h-3.5 text-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{btn.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{btn.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Prompt: {prompts.find((p) => p.id === btn.promptId)?.name || "Not set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleActive(btn.id)}
                      className="btn-ghost p-1.5"
                      title={btn.active ? "Deactivate" : "Activate"}
                    >
                      {btn.active ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(btn)}
                      className="btn-ghost p-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(btn.id)}
                      className="btn-ghost p-1.5 text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {buttons.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No buttons yet. Add one above.
        </p>
      )}
    </div>
  );
}

function ButtonForm({
  form,
  setForm,
  prompts,
  onSave,
  onCancel,
  saving,
  error,
  isNew,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  prompts: Prompt[];
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
          <label className="label">Label</label>
          <input
            className="input-field"
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Button label"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Icon</label>
          <select
            className="input-field"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
          >
            {ICON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="label">Description</label>
        <input
          className="input-field"
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Short description shown in the header"
        />
      </div>

      <div className="space-y-1.5">
        <label className="label">Linked Prompt</label>
        <select
          className="input-field"
          value={form.promptId}
          onChange={(e) => setForm((f) => ({ ...f, promptId: e.target.value }))}
        >
          <option value="">— Select a prompt —</option>
          {prompts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="btn-active"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
        />
        <label htmlFor="btn-active" className="text-sm text-foreground">Active</label>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={onSave} disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : isNew ? "Create Button" : "Save Changes"}
        </button>
        <button onClick={onCancel} className="btn-ghost text-xs">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}
