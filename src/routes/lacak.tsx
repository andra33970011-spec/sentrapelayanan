// Halaman publik lacak permohonan tanpa login — input NIK.
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Loader2, Inbox, Clock, Building2, Hash, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { STATUS_LABEL, STATUS_TONE, fmtTanggal } from "@/lib/permohonan";
import {
  lacakPermohonanByNik,
  type LacakPermohonanItem,
} from "@/lib/lacak-permohonan.functions";

export const Route = createFileRoute("/lacak")({
  head: () => ({
    meta: [
      { title: "Lacak Permohonan — Portal Buton Selatan" },
      {
        name: "description",
        content:
          "Lacak status permohonan layanan publik Pemerintah Kabupaten Buton Selatan dengan memasukkan NIK Anda. Tanpa perlu login.",
      },
      { property: "og:title", content: "Lacak Permohonan — Portal Buton Selatan" },
      {
        property: "og:description",
        content: "Cek status permohonan layanan publik Anda hanya dengan NIK.",
      },
    ],
  }),
  component: LacakPage,
});

function LacakPage() {
  const [nik, setNik] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [items, setItems] = useState<LacakPermohonanItem[]>([]);
  const [nama, setNama] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = nik.replace(/\D/g, "");
    if (cleaned.length !== 16) {
      toast.error("NIK harus 16 digit angka");
      return;
    }
    setBusy(true);
    try {
      const res = await lacakPermohonanByNik({ data: { nik: cleaned } });
      setItems(res.items);
      setNama(res.nama);
      setSubmitted(true);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell>
      <PageHero
        eyebrow="Layanan Warga"
        title="Lacak Permohonan"
        description="Pantau status permohonan layanan publik Anda hanya dengan memasukkan NIK. Tidak perlu login."
      />

      <section className="container-page py-12">
        <form
          onSubmit={onSubmit}
          className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 shadow-soft"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              Nomor Induk Kependudukan (NIK)
            </span>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                inputMode="numeric"
                autoComplete="off"
                maxLength={16}
                value={nik}
                onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 16))}
                placeholder="16 digit NIK"
                className="h-12 w-full rounded-md border border-border bg-background pl-9 pr-3 text-base tracking-wider tabular-nums shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
              />
            </div>
            <span className="mt-1.5 block text-xs text-muted-foreground">
              {nik.length}/16 digit
            </span>
          </label>

          <button
            type="submit"
            disabled={busy || nik.length !== 16}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {busy ? "Mencari…" : "Lacak Permohonan"}
          </button>

          <div className="mt-4 flex items-start gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>
              Pencarian dibatasi 10x per menit. NIK hanya digunakan untuk mencocokkan
              permohonan Anda dan tidak disimpan.
            </span>
          </div>
        </form>

        {submitted && (
          <div className="mx-auto mt-8 max-w-3xl">
            {items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
                <h3 className="mt-3 font-display text-lg font-semibold">
                  Tidak ada permohonan
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tidak ditemukan permohonan untuk NIK ini. Pastikan NIK sudah
                  benar atau ajukan permohonan baru.
                </p>
                <Link
                  to="/permohonan/baru"
                  className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Ajukan Permohonan
                </Link>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg font-semibold">
                    {items.length} Permohonan ditemukan
                  </h2>
                  {nama && (
                    <span className="text-sm text-muted-foreground">
                      atas nama <strong className="text-foreground">{nama}</strong>
                    </span>
                  )}
                </div>

                <ul className="space-y-3">
                  {items.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/30"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                            <span className="font-mono">{p.kode}</span>
                            <span>·</span>
                            <span>{p.kategori}</span>
                          </div>
                          <h3 className="mt-1 font-display text-base font-semibold text-foreground">
                            {p.judul}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {p.opd && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 className="h-3.5 w-3.5" />
                                {p.opd.singkatan}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {fmtTanggal(p.tanggal_masuk)}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`inline-flex flex-shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_TONE[p.status]}`}
                        >
                          {STATUS_LABEL[p.status]}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}
      </section>
    </PageShell>
  );
}
