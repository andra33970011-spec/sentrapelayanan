import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Database, TrendingUp, Users, Wallet, Download } from "lucide-react";

export const Route = createFileRoute("/data")({
  head: () => ({
    meta: [
      { title: "Satu Data — Pemerintah Kota Harapan" },
      { name: "description", content: "Dashboard data terpadu Kota Harapan: penduduk, anggaran, kinerja layanan, dan ekonomi." },
      { property: "og:title", content: "Satu Data Kota Harapan" },
      { property: "og:description", content: "Visualisasi data publik dan kinerja pemerintah kota." },
    ],
  }),
  component: DataPage,
});

const layananBulanan = [
  { bulan: "Jan", permohonan: 32500, selesai: 30100 },
  { bulan: "Feb", permohonan: 35200, selesai: 33700 },
  { bulan: "Mar", permohonan: 41200, selesai: 39800 },
  { bulan: "Apr", permohonan: 38900, selesai: 37200 },
  { bulan: "Mei", permohonan: 44100, selesai: 42500 },
  { bulan: "Jun", permohonan: 48200, selesai: 46900 },
];

const anggaran = [
  { sektor: "Pendidikan", nilai: 1240 },
  { sektor: "Kesehatan", nilai: 980 },
  { sektor: "Infrastruktur", nilai: 1530 },
  { sektor: "Sosial", nilai: 720 },
  { sektor: "Ekonomi", nilai: 640 },
  { sektor: "Lingkungan", nilai: 410 },
];

const penduduk = [
  { name: "0-17", value: 28 },
  { name: "18-35", value: 32 },
  { name: "36-55", value: 26 },
  { name: "56+", value: 14 },
];

const PIE_COLORS = ["oklch(0.42 0.16 258)", "oklch(0.62 0.16 235)", "oklch(0.78 0.13 80)", "oklch(0.62 0.14 155)"];

const datasets = [
  { judul: "Data Penduduk per Kelurahan 2024", opd: "Disdukcapil", format: "CSV", ukuran: "2.4 MB" },
  { judul: "Realisasi APBD Triwulan II 2024", opd: "BPKAD", format: "XLSX", ukuran: "1.1 MB" },
  { judul: "Indeks Kepuasan Masyarakat", opd: "Bag. Organisasi", format: "CSV", ukuran: "320 KB" },
  { judul: "Data Sekolah & Guru", opd: "Disdik", format: "JSON", ukuran: "780 KB" },
  { judul: "Faskes & Kapasitas Tempat Tidur", opd: "Dinkes", format: "CSV", ukuran: "640 KB" },
  { judul: "Titik Banjir & Drainase", opd: "DPUPR", format: "GeoJSON", ukuran: "3.2 MB" },
];

const kpis = [
  { icon: Users, label: "Total Penduduk", value: "1.42 Juta", trend: "+1.2% YoY" },
  { icon: Database, label: "Dataset Publik", value: "312", trend: "+18 bulan ini" },
  { icon: Wallet, label: "Realisasi APBD", value: "67.8%", trend: "Triwulan II" },
  { icon: TrendingUp, label: "Pertumbuhan Ekonomi", value: "5.4%", trend: "+0.3% QoQ" },
];

function DataPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Satu Data Indonesia"
        title="Data terpadu, terbuka, dan terverifikasi."
        description="Pantau capaian pembangunan, anggaran, dan layanan publik Kota Harapan secara real-time."
      />

      <section className="container-page -mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-2xl border border-border bg-card p-5 shadow-elevated">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <k.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{k.label}</span>
            </div>
            <div className="mt-4 font-display text-2xl font-bold">{k.value}</div>
            <div className="mt-1 text-xs text-success">{k.trend}</div>
          </div>
        ))}
      </section>

      <section className="container-page mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <h3 className="font-semibold">Permohonan Layanan Publik</h3>
          <p className="text-sm text-muted-foreground">6 bulan terakhir</p>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={layananBulanan}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.42 0.16 258)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.42 0.16 258)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.16 235)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.62 0.16 235)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" />
                <XAxis dataKey="bulan" stroke="oklch(0.48 0.03 255)" fontSize={12} />
                <YAxis stroke="oklch(0.48 0.03 255)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.91 0.012 250)" }} />
                <Area type="monotone" dataKey="permohonan" stroke="oklch(0.42 0.16 258)" fill="url(#g1)" strokeWidth={2} />
                <Area type="monotone" dataKey="selesai" stroke="oklch(0.62 0.16 235)" fill="url(#g2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h3 className="font-semibold">Komposisi Penduduk</h3>
          <p className="text-sm text-muted-foreground">Berdasarkan kelompok usia</p>
          <div className="mt-2 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={penduduk} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {penduduk.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-3">
          <h3 className="font-semibold">Alokasi Anggaran per Sektor</h3>
          <p className="text-sm text-muted-foreground">Dalam miliar rupiah, tahun anggaran berjalan</p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anggaran}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.012 250)" />
                <XAxis dataKey="sektor" stroke="oklch(0.48 0.03 255)" fontSize={12} />
                <YAxis stroke="oklch(0.48 0.03 255)" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid oklch(0.91 0.012 250)" }} />
                <Bar dataKey="nilai" fill="oklch(0.42 0.16 258)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="container-page mt-12">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Dataset Terbuka</h2>
          <a href="#" className="text-sm font-medium text-primary hover:underline">Jelajahi katalog →</a>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3">Dataset</th>
                <th className="px-5 py-3">OPD</th>
                <th className="px-5 py-3">Format</th>
                <th className="px-5 py-3">Ukuran</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {datasets.map((d) => (
                <tr key={d.judul} className="hover:bg-muted/60">
                  <td className="px-5 py-3 font-medium">{d.judul}</td>
                  <td className="px-5 py-3 text-muted-foreground">{d.opd}</td>
                  <td className="px-5 py-3"><span className="rounded-md bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{d.format}</span></td>
                  <td className="px-5 py-3 text-muted-foreground">{d.ukuran}</td>
                  <td className="px-5 py-3 text-right">
                    <a href="#" className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Download className="h-4 w-4" /> Unduh
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
