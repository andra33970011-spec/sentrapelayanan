import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import {
  IdCard, Building2, HeartPulse, GraduationCap, Truck, FileText,
  Briefcase, Home, Car, Scale, TreePine, Wifi, ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/layanan")({
  head: () => ({
    meta: [
      { title: "Layanan Publik — Pemerintah Kabupaten Buton Selatan" },
      { name: "description", content: "Daftar lengkap layanan publik online: adminduk, perizinan, kesehatan, pendidikan, bantuan sosial, dan lainnya." },
      { property: "og:title", content: "Layanan Publik Kabupaten Buton Selatan" },
      { property: "og:description", content: "Akses semua layanan publik dalam satu portal terpadu." },
    ],
  }),
  component: LayananPage,
});

const kategori = [
  {
    icon: IdCard, title: "Administrasi Kependudukan",
    items: ["Pembuatan KTP-el", "Kartu Keluarga", "Akta Kelahiran", "Akta Kematian", "Pindah Domisili"],
  },
  {
    icon: Building2, title: "Perizinan & Investasi",
    items: ["Izin Mendirikan Bangunan (PBG)", "Izin Usaha (OSS)", "Sertifikat Halal UMKM", "Izin Reklame"],
  },
  {
    icon: HeartPulse, title: "Kesehatan",
    items: ["Aktivasi BPJS", "Jadwal Puskesmas", "Vaksinasi", "Rujukan Faskes"],
  },
  {
    icon: GraduationCap, title: "Pendidikan",
    items: ["PPDB Online", "Beasiswa Daerah", "Data Sekolah", "Bantuan Seragam"],
  },
  {
    icon: Truck, title: "Bantuan Sosial",
    items: ["Pendaftaran DTKS", "PKH", "BPNT", "Bantuan Lansia"],
  },
  {
    icon: FileText, title: "Pajak & Retribusi",
    items: ["PBB Online", "BPHTB", "Pajak Restoran", "Retribusi Pasar"],
  },
  {
    icon: Briefcase, title: "Tenaga Kerja",
    items: ["Kartu Kuning (AK1)", "Lowongan Pemkot", "Pelatihan Vokasi"],
  },
  {
    icon: Home, title: "Perumahan",
    items: ["Subsidi Rumah", "Sertifikat Tanah", "Rusunawa"],
  },
  {
    icon: Car, title: "Perhubungan",
    items: ["Trayek Angkutan", "Pengaduan Lalu Lintas", "Parkir Berlangganan"],
  },
  {
    icon: Scale, title: "Hukum & Bantuan",
    items: ["Bantuan Hukum Gratis", "Konsultasi Sengketa"],
  },
  {
    icon: TreePine, title: "Lingkungan",
    items: ["Pengaduan Sampah", "Izin Lingkungan", "Penghijauan"],
  },
  {
    icon: Wifi, title: "Digital & Telekom",
    items: ["WiFi Publik", "Pengaduan Internet Desa"],
  },
];

function LayananPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Layanan Publik"
        title="Semua layanan kota dalam satu pintu digital."
        description="127 layanan online yang dikelola lintas OPD dengan SLA terukur dan status permohonan yang transparan."
      />
      <section className="container-page py-14">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {kategori.map((k) => (
            <div key={k.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <k.icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{k.title}</h3>
              </div>
              <ul className="mt-5 space-y-2">
                {k.items.map((it) => (
                  <li key={it}>
                    <a href="#" className="flex items-center justify-between rounded-md px-2 py-2 text-sm text-surface-foreground hover:bg-muted">
                      <span>{it}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
