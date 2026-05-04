import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { Star, TrendingUp, CheckCircle2, Clock, Building2, BarChart3 } from "lucide-react";
import { getKinerja, type KinerjaRingkasan } from "@/lib/kinerja.functions";

const kinerjaQO = () =>
  queryOptions({
    queryKey: ["kinerja", "publik"],
    queryFn: () => getKinerja() as Promise<KinerjaRingkasan>,
    staleTime: 60_000,
  });

export const Route = createFileRoute("/kinerja")({
  head: () => ({
    meta: [
      { title: "Dashboard Kinerja OPD — Pemerintah Kabupaten Buton Selatan" },
      { name: "description", content: "Transparansi kinerja Organisasi Perangkat Daerah: jumlah permohonan, ketepatan waktu, dan kepuasan masyarakat." },
      { property: "og:title", content: "Dashboard Kinerja OPD — Buton Selatan" },
      { property: "og:description", content: "Pantau kinerja layanan publik setiap OPD secara real-time." },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(kinerjaQO()),
  component: KinerjaPage,
});

function Stars({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-muted-foreground">Belum ada</span>;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= Math.round(value) ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold">{value.toFixed(1)}</span>
    </span>
  );
}

function KinerjaPage() {
  const { data } = useSuspenseQuery(kinerjaQO());

  const pctTepat = data.total_selesai > 0
    ? Math.round((data.total_tepat_waktu / data.total_selesai) * 100)
    : 0;
  const pctSelesai = data.total_permohonan > 0
    ? Math.round((data.total_selesai / data.total_permohonan) * 100)
    : 0;

  return (
    <PageShell>
      <PageHero
        eyebrow="Transparansi Publik"
        title="Dashboard Kinerja OPD"
        description="Pantau performa pelayanan setiap Organisasi Perangkat Daerah Kabupaten Buton Selatan secara real-time."
      />

      <section className="container-page py-10">
        {/* Ringkasan global */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatBox icon={BarChart3} tone="default" label="Total Permohonan" value={data.total_permohonan.toLocaleString("id-ID")} />
          <StatBox icon={CheckCircle2} tone="success" label="Selesai" value={`${data.total_selesai.toLocaleString("id-ID")}`} sub={`${pctSelesai}% dari total`} />
          <StatBox icon={Clock} tone="accent" label="Tepat Waktu (SLA)" value={`${pctTepat}%`} sub={`${data.total_tepat_waktu} dari ${data.total_selesai} selesai`} />
          <StatBox icon={Star} tone="gold" label="Kepuasan Warga" value={data.rata_rating_global !== null ? `${data.rata_rating_global.toFixed(1)} / 5` : "—"} sub={`${data.jumlah_rating_global} ulasan`} />
        </div>

        {/* Tabel per OPD */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="border-b border-border p-5">
            <h2 className="font-display text-lg font-bold">Kinerja per OPD</h2>
            <p className="mt-1 text-xs text-muted-foreground">Diurutkan berdasarkan jumlah permohonan terbanyak.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">OPD</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Selesai</th>
                  <th className="px-4 py-3 font-medium text-right">Diproses</th>
                  <th className="px-4 py-3 font-medium text-right">Ditolak</th>
                  <th className="px-4 py-3 font-medium text-right">% Tepat Waktu</th>
                  <th className="px-4 py-3 font-medium">Rating Warga</th>
                </tr>
              </thead>
              <tbody>
                {data.per_opd.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      Belum ada data permohonan untuk dianalisis.
                    </td>
                  </tr>
                )}
                {data.per_opd.map((o) => {
                  const pct = o.selesai > 0 ? Math.round((o.tepat_waktu / o.selesai) * 100) : 0;
                  const tone = pct >= 80 ? "text-success" : pct >= 50 ? "text-gold-foreground" : "text-destructive";
                  return (
                    <tr key={o.opd_id} className="border-t border-border hover:bg-surface/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-8 w-8 place-items-center rounded-md bg-primary-soft text-primary">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div>
                            <div className="font-semibold text-foreground">{o.singkatan}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{o.nama}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{o.total}</td>
                      <td className="px-4 py-3 text-right text-success font-medium">{o.selesai}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{o.diproses}</td>
                      <td className="px-4 py-3 text-right text-destructive">{o.ditolak}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${tone}`}>
                        {o.selesai > 0 ? `${pct}%` : "—"}
                      </td>
                      <td className="px-4 py-3"><Stars value={o.rata_rating} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-xs text-muted-foreground">
          <TrendingUp className="mr-1 inline h-3.5 w-3.5" />
          Data diperbarui otomatis setiap menit. Tepat waktu = permohonan selesai sebelum atau pada tenggat SLA.
          Rating berasal dari penilaian warga setelah layanan tuntas.
        </div>
      </section>
    </PageShell>
  );
}

function StatBox({
  icon: Icon, label, value, sub, tone = "default",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  tone?: "default" | "success" | "accent" | "gold";
}) {
  const t = {
    default: "bg-primary-soft text-primary",
    success: "bg-success/15 text-success",
    accent: "bg-accent/15 text-accent",
    gold: "bg-gold/20 text-gold-foreground",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className={`grid h-9 w-9 place-items-center rounded-lg ${t}`}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
