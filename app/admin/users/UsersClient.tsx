"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  active: boolean;
  permissions: string[];
}

interface Button {
  id: string;
  label: string;
}

interface Props {
  initialUsers: UserRecord[];
  buttons: Button[];
}

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "user" as "admin" | "user",
  active: true,
  permissions: [] as string[],
};

export default function UsersClient({ initialUsers, buttons }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function startAdd() {
    setForm({ ...EMPTY_FORM });
    setAdding(true);
    setEditing(null);
    setError("");
  }

  function startEdit(user: UserRecord) {
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      active: user.active,
      permissions: [...user.permissions],
    });
    setEditing(user.id);
    setAdding(false);
    setError("");
  }

  function cancel() {
    setAdding(false);
    setEditing(null);
    setError("");
  }

  function togglePermission(btnId: string) {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(btnId)
        ? f.permissions.filter((p) => p !== btnId)
        : [...f.permissions, btnId],
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      if (adding) {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setUsers((u) => [...u, data.user]);
      } else if (editing) {
        const body: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          role: form.role,
          active: form.active,
          permissions: form.permissions,
        };
        if (form.password) body.password = form.password;

        const res = await fetch(`/api/users/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); return; }
        setUsers((u) => u.map((usr) => usr.id === editing ? data.user : usr));
      }

      cancel();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.error); return; }
    setUsers((u) => u.filter((usr) => usr.id !== id));
  }

  const activeUsers = users.filter((u) => u.role === "user");
  const adminUsers = users.filter((u) => u.role === "admin");

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-base text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage user access and permissions
          </p>
        </div>
        <button onClick={startAdd} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Add User
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <UserForm
          form={form}
          setForm={setForm}
          buttons={buttons}
          togglePermission={togglePermission}
          onSave={handleSave}
          onCancel={cancel}
          saving={saving}
          error={error}
          isNew
        />
      )}

      {/* Users list */}
      {[...adminUsers, ...activeUsers].map((user) => (
        <div key={user.id}>
          {editing === user.id ? (
            <UserForm
              form={form}
              setForm={setForm}
              buttons={buttons}
              togglePermission={togglePermission}
              onSave={handleSave}
              onCancel={cancel}
              saving={saving}
              error={error}
            />
          ) : (
            <div className="card p-4 mb-2 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs shrink-0 mt-0.5">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{user.name}</span>
                  {user.role === "admin" ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <User className="w-3 h-3" /> User
                    </span>
                  )}
                  {!user.active && (
                    <span className="text-xs text-destructive">Inactive</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                {user.role === "user" && user.permissions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {user.permissions.map((pid) => {
                      const btn = buttons.find((b) => b.id === pid);
                      return btn ? (
                        <span
                          key={pid}
                          className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm"
                        >
                          {btn.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(user)}
                  className="btn-ghost p-1.5"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="btn-ghost p-1.5 text-destructive hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {users.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No users yet. Add one above.
        </p>
      )}
    </div>
  );
}

function UserForm({
  form,
  setForm,
  buttons,
  togglePermission,
  onSave,
  onCancel,
  saving,
  error,
  isNew,
}: {
  form: typeof EMPTY_FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>>;
  buttons: Button[];
  togglePermission: (id: string) => void;
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
            placeholder="Full name"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Email</label>
          <input
            className="input-field"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="email@domain.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="label">
            {isNew ? "Password" : "New Password (leave blank to keep)"}
          </label>
          <input
            className="input-field"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder={isNew ? "Set password" : "Leave blank to keep current"}
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Role</label>
          <select
            className="input-field"
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({ ...f, role: e.target.value as "admin" | "user" }))
            }
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="active"
          checked={form.active}
          onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          className="rounded border-input"
        />
        <label htmlFor="active" className="text-sm text-foreground">
          Active
        </label>
      </div>

      {form.role === "user" && buttons.length > 0 && (
        <div className="space-y-2">
          <label className="label">Button Permissions</label>
          <div className="flex flex-wrap gap-2">
            {buttons.map((btn) => {
              const has = form.permissions.includes(btn.id);
              return (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => togglePermission(btn.id)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-md border transition-all",
                    has
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-secondary"
                  )}
                >
                  {has && <Check className="w-3 h-3 inline mr-1" />}
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex items-center gap-2 pt-1">
        <button onClick={onSave} disabled={saving} className="btn-primary text-xs">
          {saving ? "Saving..." : isNew ? "Create User" : "Save Changes"}
        </button>
        <button onClick={onCancel} className="btn-ghost text-xs">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
      </div>
    </div>
  );
}
