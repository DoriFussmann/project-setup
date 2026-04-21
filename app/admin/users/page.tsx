"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Shield, User } from "lucide-react";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  active: boolean;
  permissions: string[];
}

interface ButtonRecord {
  id: string;
  label: string;
}

type FormRole = "admin" | "user";
const EMPTY_FORM: { email: string; name: string; password: string; role: FormRole; active: boolean; permissions: string[] } = { email: "", name: "", password: "", role: "user", active: true, permissions: [] };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [buttons, setButtons] = useState<ButtonRecord[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    fetch("/api/config").then(r => r.json()).then(d => setButtons(d.buttons || []));
  }, []);

  async function load() {
    const d = await fetch("/api/users").then(r => r.json());
    setUsers(d.users || []);
  }

  function startAdd() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError("");
  }

  function startEdit(u: UserRecord) {
    setEditing(u.id);
    setForm({ email: u.email, name: u.name, password: "", role: u.role, active: u.active, permissions: u.permissions });
    setShowForm(true);
    setError("");
  }

  function cancel() {
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function save() {
    setError("");
    setSaving(true);
    try {
      const body: Record<string, unknown> = { ...form };
      if (editing && !body.password) delete body.password;

      const res = editing
        ? await fetch(`/api/users/${editing}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        : await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      await load();
      cancel();
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    await load();
  }

  function togglePermission(btnId: string) {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(btnId)
        ? f.permissions.filter(p => p !== btnId)
        : [...f.permissions, btnId],
    }));
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg text-foreground mb-1">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} total</p>
        </div>
        <button onClick={startAdd} className="btn-primary">
          <Plus className="w-3.5 h-3.5" /> Add user
        </button>
      </div>

      {/* Form panel */}
      {showForm && (
        <div className="card p-5 mb-6 max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm text-foreground">{editing ? "Edit user" : "New user"}</h2>
            <button onClick={cancel} className="p-1 rounded hover:bg-accent transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">Name</label>
                <input className="input-field" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <label className="label">Email</label>
                <input type="email" className="input-field" placeholder="email@co.com" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="label">{editing ? "New password (optional)" : "Password"}</label>
                <input type="password" className="input-field" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} />
              </div>
              <div className="space-y-1">
                <label className="label">Role</label>
                <select className="input-field" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value as FormRole}))}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="active" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} className="w-3.5 h-3.5" />
              <label htmlFor="active" className="text-xs text-foreground">Active</label>
            </div>

            {form.role === "user" && buttons.length > 0 && (
              <div className="space-y-1.5">
                <label className="label">Button permissions</label>
                <div className="flex flex-wrap gap-2">
                  {buttons.map(btn => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => togglePermission(btn.id)}
                      className={[
                        "px-2.5 py-1 rounded text-xs transition-all",
                        form.permissions.includes(btn.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground hover:bg-accent",
                      ].join(" ")}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

      {/* Users table */}
      <div className="card overflow-hidden max-w-3xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-normal">Name</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-normal">Email</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-normal">Role</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-normal">Status</th>
              <th className="text-left px-4 py-3 text-xs text-muted-foreground font-normal">Permissions</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.id} className={i !== users.length - 1 ? "border-b border-border" : ""}>
                <td className="px-4 py-3 text-foreground">{u.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={[
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs",
                    u.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground",
                  ].join(" ")}>
                    {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={["text-xs px-2 py-0.5 rounded", u.active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"].join(" ")}>
                    {u.active ? "active" : "inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground">{u.permissions.length} buttons</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => startEdit(u)} className="p-1.5 rounded hover:bg-accent transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => deleteUser(u.id)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
