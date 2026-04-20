import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Paperclip,
  Clock,
  Send,
  UserPlus,
} from "lucide-react";
import {
  OPD_LIST,
  PETUGAS_LIST,
  STATUS_LABEL,
  STATUS_TONE,
  type StatusPermohonan,
} from "@/data/admin-mock";
import {
  tambahCatatan,
  tugaskanPetugas,
  ubahStatus,
  useAdminStore,
} from "@/store/admin-store";
import { AdminShell } from "@/components/admin/AdminShell";

export const Route = createFileRoute("/admin/permohonan/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Permohonan ${params.id} — Admin Kabupaten Buton Selatan` },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DetailPermohonan,
  notFoundComponent: () => (
    <AdminShell breadcrumb={[{ label: "Permohonan" }]}>
      <div className="rounded-xl border border-border bg-card p-12 text-center">
        <h1 className="font-display text-xl font-bold">Permohonan tidak ditemukan</h1>
        <p className="mt-2 text-sm text-muted-foreground">ID permohonan tidak terdaftar.</p>
        <Link to="/admin" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
          <ArrowLeft className="h-4 w-4" /> Kembali ke dashboard
        </Link>
      </div>
    </AdminShell>
  ),
});

const STATUS_OPTIONS: StatusPermohonan[] = ["baru", "diproses", "selesai", "ditolak"];
const ADMIN_NAME = "Admin OPD";

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailPermohonan() {
  const { id } = Route.useParams();
  const { permohonan } = useAdminStore();
  const item = useMemo(() => permohonan.find((p) => p.id === id), [permohonan, id]);

  if (!item) throw notFound();

  const opd = OPD_LIST.find((o) => o.id === item.opdId)!;
  const petugasOPD = PETUGAS_LIST.filter((p) => p.opdId === item.opdId);
  const petugas = PETUGAS_LIST.find((p) => p.id === item.petugasId);

  const [statusBaru, setStatusBaru] = useState<StatusPermohonan>(item.status);
  const [catatanStatus, setCatatanStatus] = useState("");
  const [petugasPilih, setPetugasPilih] = useState<string>(item.petugasId ?? "");
  const [catatanBaru, setCatatanBaru] = useState("");

  return (
    <AdminShell breadcrumb={[{ label: "Permohonan", to: "/admin" }, { label: item.id }]}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{opd.singkatan} · {item.kategori}</div>
          <h1 className="truncate font-display text-xl font-bold md:text-2xl">{item.judul}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-mono text-muted-foreground">{item.id}</span>
            <span className={`rounded-full border px-2 py-0.5 font-medium ${STATUS_TONE[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </span>
            <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground capitalize">
              Prioritas: {item.prioritas}
            </span>
          </div>
        </div>
        <Link to="/admin" className="hidden sm:inline-flex items-center gap-1 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Daftar
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Kolom utama */}
        <div className="space-y-4 lg:col-span-2">
          {/* Pemohon */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Data Pemohon
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field icon={IdCard} label="Nama">{item.pemohon.nama}</Field>
              <Field icon={IdCard} label="NIK">{item.pemohon.nik}</Field>
              <Field icon={Phone} label="Telepon">{item.pemohon.telepon}</Field>
              <Field icon={Mail} label="Email">{item.pemohon.email}</Field>
              <Field icon={MapPin} label="Alamat" className="sm:col-span-2">{item.pemohon.alamat}</Field>
            </div>
          </div>

          {/* Ringkasan */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ringkasan Permohonan
            </h2>
            <p className="text-sm text-foreground">{item.ringkasan}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>Diajukan: <strong className="text-foreground">{fmtDateTime(item.tanggalMasuk)}</strong></span>
              <span>Tenggat: <strong className="text-foreground">{fmtDateTime(item.tenggat)}</strong></span>
            </div>
          </div>

          {/* Lampiran */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Lampiran
            </h2>
            <ul className="divide-y divide-border">
              {item.lampiran.map((l) => (
                <li key={l.nama} className="flex items-center gap-3 py-2">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-primary-soft text-primary">
                    <Paperclip className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{l.nama}</div>
                    <div className="text-xs text-muted-foreground">{l.ukuran}</div>
                  </div>
                  <button className="text-xs font-medium text-primary hover:underline" type="button">
                    Pratinjau
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Riwayat */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Riwayat & Catatan
            </h2>
            <ol className="space-y-3">
              {item.riwayat.map((r, i) => (
                <li key={i} className="relative pl-6">
                  <span className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-primary" />
                  <div className="text-sm font-medium text-foreground">{r.aksi}</div>
                  <div className="text-xs text-muted-foreground">
                    <Clock className="mr-1 inline h-3 w-3" />
                    {fmtDateTime(r.ts)} · oleh {r.oleh}
                  </div>
                  {r.catatan && <div className="mt-1 text-sm text-surface-foreground">{r.catatan}</div>}
                </li>
              ))}
            </ol>

            {/* Tambah catatan */}
            <div className="mt-4 border-t border-border pt-4">
              <label className="text-xs font-medium text-muted-foreground">Tambah catatan internal</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={catatanBaru}
                  onChange={(e) => setCatatanBaru(e.target.value)}
                  placeholder="Catatan untuk arsip…"
                  className="h-10 flex-1 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  type="button"
                  onClick={() => {
                    tambahCatatan(item.id, catatanBaru, ADMIN_NAME);
                    setCatatanBaru("");
                  }}
                  disabled={!catatanBaru.trim()}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Tambah
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom aksi */}
        <aside className="space-y-4">
          {/* Ubah status */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Ubah Status
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusBaru(s)}
                  className={`rounded-md border px-3 py-2 text-xs font-semibold capitalize transition ${
                    statusBaru === s
                      ? STATUS_TONE[s] + " ring-2 ring-ring"
                      : "border-border bg-background text-surface-foreground hover:bg-muted"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <textarea
              value={catatanStatus}
              onChange={(e) => setCatatanStatus(e.target.value)}
              placeholder="Catatan perubahan status (opsional)…"
              rows={3}
              className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="button"
              onClick={() => {
                ubahStatus(item.id, statusBaru, catatanStatus, ADMIN_NAME);
                setCatatanStatus("");
              }}
              disabled={statusBaru === item.status && !catatanStatus.trim()}
              className="mt-3 w-full rounded-md bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-50"
            >
              Simpan Perubahan
            </button>
          </div>

          {/* Assignment */}
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Petugas Penanggung Jawab
            </h2>
            {petugas ? (
              <div className="mb-3 flex items-center gap-3 rounded-md bg-primary-soft p-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {petugas.inisial}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{petugas.nama}</div>
                  <div className="truncate text-xs text-muted-foreground">{petugas.jabatan}</div>
                </div>
              </div>
            ) : (
              <div className="mb-3 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                Belum ditugaskan
              </div>
            )}
            <label className="text-xs font-medium text-muted-foreground">Pilih petugas</label>
            <select
              value={petugasPilih}
              onChange={(e) => setPetugasPilih(e.target.value)}
              className="mt-1 h-10 w-full rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Pilih —</option>
              {petugasOPD.map((p) => (
                <option key={p.id} value={p.id}>{p.nama} · {p.jabatan}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => petugasPilih && tugaskanPetugas(item.id, petugasPilih, ADMIN_NAME)}
              disabled={!petugasPilih || petugasPilih === item.petugasId}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary bg-background px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-soft disabled:opacity-50"
            >
              <UserPlus className="h-4 w-4" /> Tugaskan
            </button>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}

function Field({
  icon: Icon,
  label,
  children,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 flex items-start gap-2 text-sm text-foreground">
        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <span className="break-words">{children}</span>
      </div>
    </div>
  );
}
