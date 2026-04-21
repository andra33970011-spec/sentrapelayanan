// Manajemen User — hanya super admin.
// Listing semua user (via profil), edit role & assign OPD via server function.
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Loader2, Save, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { setUserRole } from "@/lib/admin-actions.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manajemen User — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminGuard>
      <UsersPage />
    </AdminGuard>
  ),
});

type Profile = { id: string; nama_lengkap: string; nik: string | null; no_hp: string | null; opd_id: string | null };
type Role = { user_id: string; role: "warga" | "admin_opd" | "super_admin" };
type Opd = { id: string; nama: string; singkatan: string };
type Row = Profile & { role: Role["role"]; pendingRole?: Role["role"]; pendingOpd?: string | null };

function UsersPage() {
  const { isSuperAdmin } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [opds, setOpds] = useState<Opd[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    const [{ data: profiles }, { data: roles }, { data: opdRows }] = await Promise.all([
      supabase.from("profiles").select("id,nama_lengkap,nik,no_hp,opd_id").order("nama_lengkap"),
      supabase.from("user_roles").select("user_id,role"),
      supabase.from("opd").select("id,nama,singkatan").order("nama"),
    ]);
    const roleMap = new Map<string, Role["role"]>();
    (roles ?? []).forEach((r) => roleMap.set(r.user_id, r.role as Role["role"]));
    setRows(((profiles ?? []) as Profile[]).map((p) => ({ ...p, role: roleMap.get(p.id) ?? "warga" })));
    setOpds((opdRows ?? []) as Opd[]);
    setLoading(false);
  }
  useEffect(() => { if (isSuperAdmin) load(); }, [isSuperAdmin]);

  async function save(row: Row) {
    setSavingId(row.id);
    try {
      const role = row.pendingRole ?? row.role;
      const opd_id = role === "admin_opd" ? (row.pendingOpd ?? row.opd_id ?? null) : null;
      await setUserRole({ data: { user_id: row.id, role, opd_id } });
      toast.success("Role diperbarui");
      await load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  if (!isSuperAdmin) {
    return (
      <AdminShell breadcrumb={[{ label: "Manajemen User" }]}>
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Halaman ini hanya untuk Super Admin.
        </div>
      </AdminShell>
    );
  }

  const filtered = rows.filter((r) =>
    !q.trim() || r.nama_lengkap.toLowerCase().includes(q.toLowerCase()) || (r.nik ?? "").includes(q),
  );

  return (
    <AdminShell breadcrumb={[{ label: "Manajemen User" }]}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Manajemen User</h1>
          <p className="text-sm text-muted-foreground">Kelola peran dan penugasan OPD untuk semua user.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama / NIK…"
            className="h-9 w-64 rounded-md border border-border bg-background pl-8 pr-3 text-sm"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">NIK / HP</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">OPD</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Memuat…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">Tidak ada user.</td></tr>}
            {filtered.map((r) => {
              const role = r.pendingRole ?? r.role;
              const opd = r.pendingOpd ?? r.opd_id;
              const dirty = (r.pendingRole && r.pendingRole !== r.role) || (role === "admin_opd" && (r.pendingOpd ?? r.opd_id) !== r.opd_id);
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-foreground">{r.nama_lengkap || "(tanpa nama)"}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <div>{r.nik ?? "—"}</div>
                    <div>{r.no_hp ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={role}
                      onChange={(e) =>
                        setRows((prev) => prev.map((p) => p.id === r.id ? { ...p, pendingRole: e.target.value as Role["role"] } : p))
                      }
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                    >
                      <option value="warga">Warga</option>
                      <option value="admin_opd">Admin OPD</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      disabled={role !== "admin_opd"}
                      value={opd ?? ""}
                      onChange={(e) =>
                        setRows((prev) => prev.map((p) => p.id === r.id ? { ...p, pendingOpd: e.target.value || null } : p))
                      }
                      className="h-9 rounded-md border border-border bg-background px-2 text-sm disabled:opacity-50"
                    >
                      <option value="">— Pilih OPD —</option>
                      {opds.map((o) => (<option key={o.id} value={o.id}>{o.singkatan}</option>))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => save(r)}
                      disabled={!dirty || savingId === r.id || (role === "admin_opd" && !opd)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                    >
                      {savingId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Simpan
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
