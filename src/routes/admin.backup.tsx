// Backup & disaster recovery — Super Admin.
// Export tabel-tabel kunci sebagai JSON / CSV.
// Memanggil server function exportTable yang bypass RLS dengan pembatasan rate.
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Loader2, Database, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAuth } from "@/lib/auth-context";
import { exportTable, enqueueJob } from "@/lib/admin-actions.functions";

export const Route = createFileRoute("/admin/backup")({
  head: () => ({ meta: [{ title: "Backup Data — Admin" }, { name: "robots", content: "noindex" }] }),
  component: () => (
    <AdminGuard>
      <BackupPage />
    </AdminGuard>
  ),
});

const TABLES = [
  { id: "profiles", label: "Profil Pengguna" },
  { id: "user_roles", label: "Peran User" },
  { id: "opd", label: "OPD" },
  { id: "permohonan", label: "Permohonan" },
  { id: "permohonan_riwayat", label: "Riwayat Permohonan" },
  { id: "audit_log", label: "Audit Log" },
  { id: "job_queue", label: "Job Queue" },
] as const;

type TableId = (typeof TABLES)[number]["id"];

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const cols = Array.from(rows.reduce((set, r) => { Object.keys(r).forEach((k) => set.add(k)); return set; }, new Set<string>()));
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...rows.map((r) => cols.map((c) => escape(r[c])).join(","))].join("\n");
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function BackupPage() {
  const { isSuperAdmin } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);

  async function handleExport(t: TableId, fmt: "json" | "csv") {
    setBusy(`${t}-${fmt}`);
    try {
      const res = await exportTable({ data: { tabel: t } });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      if (fmt === "json") {
        download(`${t}_${stamp}.json`, JSON.stringify(res.rows, null, 2), "application/json");
      } else {
        download(`${t}_${stamp}.csv`, toCSV(res.rows as Record<string, unknown>[]), "text/csv");
      }
      toast.success(`${t}: ${res.rows.length} baris diunduh`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function runMaintenance(jobType: string) {
    try {
      await enqueueJob({ data: { job_type: jobType, payload: {} } });
      toast.success("Job dijadwalkan, akan dijalankan dalam 1 menit");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  if (!isSuperAdmin) {
    return (
      <AdminShell breadcrumb={[{ label: "Backup" }]}>
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Hanya Super Admin.</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell breadcrumb={[{ label: "Backup Data" }]}>
      <h1 className="mb-1 font-display text-2xl font-bold">Backup &amp; Disaster Recovery</h1>
      <p className="mb-4 text-sm text-muted-foreground">Unduh snapshot data sebagai JSON atau CSV. Disarankan dijadwalkan rutin.</p>

      <div className="mb-6 flex gap-3 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm">
        <AlertTriangle className="h-5 w-5 shrink-0 text-gold-foreground" />
        <div>
          <div className="font-semibold text-foreground">Catatan</div>
          <p className="mt-1 text-muted-foreground">
            Untuk perlindungan menyeluruh, aktifkan <strong>Point-in-Time Recovery</strong> di pengaturan database (perlu plan berbayar).
            Export di sini berfungsi sebagai <em>safety net manual</em>.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {TABLES.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary">
                <Database className="h-4 w-4" />
              </span>
              <div>
                <div className="font-medium text-foreground">{t.label}</div>
                <div className="font-mono text-xs text-muted-foreground">{t.id}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport(t.id, "json")}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
              >
                {busy === `${t.id}-json` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                JSON
              </button>
              <button
                onClick={() => handleExport(t.id, "csv")}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy === `${t.id}-csv` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <h2 className="font-display text-base font-semibold">Pemeliharaan</h2>
        <p className="mt-1 text-sm text-muted-foreground">Jadwalkan job pembersihan latar belakang.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => runMaintenance("audit.cleanup")} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
            Bersihkan Audit Log &gt;180 hari
          </button>
          <button onClick={() => runMaintenance("ratelimit.cleanup")} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
            Bersihkan Rate Limit &gt;1 jam
          </button>
        </div>
      </div>
    </AdminShell>
  );
}
