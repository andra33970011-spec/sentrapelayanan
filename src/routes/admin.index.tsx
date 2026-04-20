import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Inbox,
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ArrowUpRight,
  CalendarClock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { AdminShell, StatCard } from "@/components/admin/AdminShell";
import {
  OPD_LIST,
  PETUGAS_LIST,
  STATUS_LABEL,
  STATUS_TONE,
  type StatusPermohonan,
} from "@/data/admin-mock";
import { useAdminStore } from "@/store/admin-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin OPD — Kabupaten Buton Selatan" },
      { name: "description", content: "Kelola permohonan warga: filter status & kategori, tugaskan petugas, pantau KPI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

const STATUS_OPTIONS: ("semua" | StatusPermohonan)[] = ["semua", "baru", "diproses", "selesai", "ditolak"];

function fmtTanggal(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

function AdminDashboard() {
  const { opdAktifId, permohonan } = useAdminStore();
  const opd = OPD_LIST.find((o) => o.id === opdAktifId)!;

  const [status, setStatus] = useState<"semua" | StatusPermohonan>("semua");
  const [kategori, setKategori] = useState<string>("semua");
  const [q, setQ] = useState("");

  // Permohonan untuk OPD aktif
  const opdItems = useMemo(
    () => permohonan.filter((p) => p.opdId === opdAktifId),
    [permohonan, opdAktifId],
  );

  const filtered = useMemo(() => {
    return opdItems.filter((p) => {
      if (status !== "semua" && p.status !== status) return false;
      if (kategori !== "semua" && p.kategori !== kategori) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        if (
          !p.id.toLowerCase().includes(needle) &&
          !p.judul.toLowerCase().includes(needle) &&
          !p.pemohon.nama.toLowerCase().includes(needle)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [opdItems, status, kategori, q]);

  // KPI
  const kpi = useMemo(() => {
    const c = { baru: 0, diproses: 0, selesai: 0, ditolak: 0 };
    opdItems.forEach((p) => { c[p.status]++; });
    return c;
  }, [opdItems]);

  // Chart tren 14 hari terakhir
  const trend = useMemo(() => {
    const days: { label: string; key: string; masuk: number; selesai: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({
        label: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        key,
        masuk: 0,
        selesai: 0,
      });
    }
    const map = new Map(days.map((d) => [d.key, d]));
    opdItems.forEach((p) => {
      const k = p.tanggalMasuk.slice(0, 10);
      const row = map.get(k);
      if (row) row.masuk++;
      if (p.status === "selesai") {
        const last = p.riwayat[p.riwayat.length - 1]?.ts.slice(0, 10);
        const r2 = last ? map.get(last) : undefined;
        if (r2) r2.selesai++;
      }
    });
    return days;
  }, [opdItems]);

  // Distribusi kategori
  const distribusiKategori = useMemo(() => {
    const m = new Map<string, number>();
    opdItems.forEach((p) => m.set(p.kategori, (m.get(p.kategori) ?? 0) + 1));
    return Array.from(m, ([nama, jumlah]) => ({ nama, jumlah }));
  }, [opdItems]);

  return (
    <AdminShell>
      {/* Heading */}
      <div className="mb-6 flex flex-col gap-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {opd.singkatan}
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          Dashboard Permohonan Warga
        </h1>
        <p className="text-sm text-muted-foreground">
          Pantau & proses pengajuan layanan publik secara terpusat.
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Baru" value={kpi.baru} delta="Menunggu verifikasi" tone="accent" icon={Inbox} />
        <StatCard label="Diproses" value={kpi.diproses} delta="Sedang dikerjakan" tone="gold" icon={Loader2} />
        <StatCard label="Selesai" value={kpi.selesai} delta="Total bulan berjalan" tone="success" icon={CheckCircle2} />
        <StatCard label="Ditolak" value={kpi.ditolak} delta="Berkas tidak lengkap" tone="destructive" icon={XCircle} />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-soft lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold">Tren 14 hari terakhir</h2>
              <p className="text-xs text-muted-foreground">Permohonan masuk vs diselesaikan</p>
            </div>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="h-56 w-full">
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
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="oklch(0.48 0.03 255)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="oklch(0.48 0.03 255)" />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.91 0.012 250)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="masuk" name="Masuk" stroke="oklch(0.42 0.16 258)" fill="url(#gMasuk)" strokeWidth={2} />
                <Area type="monotone" dataKey="selesai" name="Selesai" stroke="oklch(0.62 0.14 155)" fill="url(#gSelesai)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-soft">
          <h2 className="mb-1 font-display text-base font-semibold">Distribusi kategori</h2>
          <p className="mb-3 text-xs text-muted-foreground">Permohonan per layanan</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribusiKategori} layout="vertical" margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} stroke="oklch(0.48 0.03 255)" />
                <YAxis type="category" dataKey="nama" width={110} tick={{ fontSize: 11 }} stroke="oklch(0.48 0.03 255)" />
                <Tooltip
                  contentStyle={{
                    background: "oklch(1 0 0)",
                    border: "1px solid oklch(0.91 0.012 250)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="jumlah" fill="oklch(0.55 0.16 258)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter + Tabel */}
      <section id="tabel" className="mt-6 rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-col gap-3 border-b border-border p-4 md:flex-row md:items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-base font-semibold">Daftar Permohonan</h2>
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
              {filtered.length}
            </span>
          </div>
          <div className="md:ml-auto flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari ID / nama / judul…"
                className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-64"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "semua" | StatusPermohonan)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              aria-label="Filter status"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === "semua" ? "Semua status" : STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="h-9 rounded-md border border-border bg-background px-2 text-sm"
              aria-label="Filter kategori"
            >
              <option value="semua">Semua kategori</option>
              {opd.kategori.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabel desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Pemohon / Judul</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Petugas</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Tidak ada permohonan yang cocok dengan filter.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const ptg = PETUGAS_LIST.find((x) => x.id === p.petugasId);
                return (
                  <tr key={p.id} className="border-t border-border hover:bg-surface/60">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{p.pemohon.nama}</div>
                      <div className="text-xs text-muted-foreground">{p.judul}</div>
                    </td>
                    <td className="px-4 py-3 text-foreground">{p.kategori}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {ptg ? (
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                            {ptg.inisial}
                          </span>
                          <span className="text-xs">{ptg.nama}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Belum ditugaskan</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {fmtTanggal(p.tanggalMasuk)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to="/admin/permohonan/$id"
                        params={{ id: p.id }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Detail <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {filtered.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">
              Tidak ada permohonan yang cocok.
            </div>
          )}
          {filtered.map((p) => {
            const ptg = PETUGAS_LIST.find((x) => x.id === p.petugasId);
            return (
              <Link
                key={p.id}
                to="/admin/permohonan/$id"
                params={{ id: p.id }}
                className="block px-4 py-3 hover:bg-surface/60"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-[10px] text-muted-foreground">{p.id}</div>
                    <div className="truncate font-medium text-foreground">{p.pemohon.nama}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.kategori}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{ptg ? ptg.nama : "Belum ditugaskan"}</span>
                  <span>{fmtTanggal(p.tanggalMasuk)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
}
