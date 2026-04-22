// Admin dashboard — DB real.
// - Super admin: lihat semua OPD; bisa filter by OPD; widget SLA, backlog OPD, status sistem
// - Admin OPD: otomatis terbatas ke OPD-nya (RLS yang menjamin)
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, Loader2, CheckCircle2, XCircle, Search, Filter, ArrowUpRight, Clock, Building2, Database as DbIcon, AlertTriangle, ShieldCheck, Users as UsersIcon, FileClock, Newspaper, Settings, FolderOpen } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_TONE, fmtTanggal, type StatusPermohonan } from "@/lib/permohonan";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — Kabupaten Buton Selatan" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminGuard>
      <AdminDashboard />
    </AdminGuard>
  ),
});

type Permohonan = {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  status: StatusPermohonan;
  tanggal_masuk: string;
  opd_id: string;
  pemohon_id: string;
  petugas_id: string | null;
};
type Opd = { id: string; nama: string; singkatan: string; kategori: string[] };

const STATUS_OPTIONS: ("semua" | StatusPermohonan)[] = ["semua", "baru", "diproses", "selesai", "ditolak"];

function AdminDashboard() {
  const { isSuperAdmin, user } = useAuth();
  const [opdList, setOpdList] = useState<Opd[]>([]);
  const [opdAktifId, setOpdAktifId] = useState<string>("");
  const [items, setItems] = useState<Permohonan[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"semua" | StatusPermohonan>("semua");
  const [kategori, setKategori] = useState<string>("semua");
  const [q, setQ] = useState("");

  // Resolve OPD admin
  useEffect(() => {
    supabase.from("opd").select("id,nama,singkatan,kategori").order("nama").then(({ data }) => {
      setOpdList((data ?? []) as Opd[]);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    if (!isSuperAdmin) {
      // Admin OPD: ambil opd_id dari profil
      supabase.from("profiles").select("opd_id").eq("id", user.id).maybeSingle().then(({ data }) => {
        setOpdAktifId(data?.opd_id ?? "");
      });
    }
  }, [user, isSuperAdmin]);

  // Load permohonan (RLS membatasi otomatis)
  useEffect(() => {
    setLoading(true);
    let q = supabase
      .from("permohonan")
      .select("id,kode,judul,kategori,status,tanggal_masuk,opd_id,pemohon_id,petugas_id")
      .order("tanggal_masuk", { ascending: false })
      .limit(500);
    if (opdAktifId) q = q.eq("opd_id", opdAktifId);
    q.then(({ data }) => {
      setItems((data ?? []) as Permohonan[]);
      setLoading(false);
    });
  }, [opdAktifId]);

  const opd = opdList.find((o) => o.id === opdAktifId);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (status !== "semua" && p.status !== status) return false;
      if (kategori !== "semua" && p.kategori !== kategori) return false;
      if (q.trim()) {
        const n = q.toLowerCase();
        if (!p.kode.toLowerCase().includes(n) && !p.judul.toLowerCase().includes(n)) return false;
      }
      return true;
    });
  }, [items, status, kategori, q]);

  const kpi = useMemo(() => {
    const c = { baru: 0, diproses: 0, selesai: 0, ditolak: 0 };
    items.forEach((p) => { c[p.status]++; });
    return c;
  }, [items]);

  const trend = useMemo(() => {
    const days: { label: string; key: string; masuk: number; selesai: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }), key, masuk: 0, selesai: 0 });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    items.forEach((p) => {
      const k = p.tanggal_masuk.slice(0, 10);
      const row = map.get(k);
      if (row) row.masuk++;
      if (p.status === "selesai" && row) row.selesai++;
    });
    return days;
  }, [items]);

  const distribusiKategori = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((p) => m.set(p.kategori, (m.get(p.kategori) ?? 0) + 1));
    return Array.from(m, ([nama, jumlah]) => ({ nama, jumlah })).sort((a, b) => b.jumlah - a.jumlah).slice(0, 8);
  }, [items]);

  return (
    <AdminShell
      opdAktifId={opdAktifId}
      onChangeOpd={isSuperAdmin ? setOpdAktifId : undefined}
    >
      <div className="mb-6">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{opd?.singkatan ?? "Semua OPD"}</div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Dashboard Permohonan Warga</h1>
        <p className="text-sm text-muted-foreground">Pantau & proses pengajuan layanan publik secara terpusat.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Baru" value={kpi.baru} delta="Menunggu verifikasi" tone="accent" icon={Inbox} />
        <StatCard label="Diproses" value={kpi.diproses} delta="Sedang dikerjakan" tone="gold" icon={Loader2} />
        <StatCard label="Selesai" value={kpi.selesai} delta="Total" tone="success" icon={CheckCircle2} />
        <StatCard label="Ditolak" value={kpi.ditolak} delta="Berkas tidak lengkap" tone="destructive" icon={XCircle} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Tren 14 hari terakhir</h2>
          <p className="text-xs text-muted-foreground">Permohonan masuk vs diselesaikan</p>
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gMasuk" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.16 258)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.55 0.16 258)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSelesai" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.14 155)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="oklch(0.62 0.14 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.91 0.012 250)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="masuk" name="Masuk" stroke="oklch(0.42 0.16 258)" fill="url(#gMasuk)" strokeWidth={2} />
                <Area type="monotone" dataKey="selesai" name="Selesai" stroke="oklch(0.62 0.14 155)" fill="url(#gSelesai)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <h2 className="font-display text-base font-semibold">Distribusi kategori</h2>
          <p className="text-xs text-muted-foreground">Top 8 layanan</p>
          <div className="mt-3 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribusiKategori} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="nama" width={110} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "oklch(1 0 0)", border: "1px solid oklch(0.91 0.012 250)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="jumlah" fill="oklch(0.55 0.16 258)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section id="tabel" className="mt-6 rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-base font-semibold">Daftar Permohonan</h2>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{filtered.length}</span>
          </div>
          <div className="md:ml-auto flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari kode / judul…"
                className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm sm:w-64"
              />
            </div>
            <select value={status} onChange={(e) => setStatus(e.target.value as "semua" | StatusPermohonan)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "semua" ? "Semua status" : STATUS_LABEL[s]}</option>
              ))}
            </select>
            {opd && (
              <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="h-9 rounded-md border border-border bg-background px-2 text-sm">
                <option value="semua">Semua kategori</option>
                {opd.kategori.map((k) => (<option key={k} value={k}>{k}</option>))}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Judul</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Memuat…</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">Tidak ada permohonan.</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-surface/60">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.kode}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{p.judul}</td>
                  <td className="px-4 py-3">{p.kategori}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[p.status]}`}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtTanggal(p.tanggal_masuk)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to="/admin/permohonan/$id" params={{ id: p.id }} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Detail <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
