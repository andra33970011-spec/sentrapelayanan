import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { Calendar, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/berita")({
  head: () => ({
    meta: [
      { title: "Berita & Pengumuman — Pemerintah Kabupaten Buton Selatan" },
      { name: "description", content: "Berita resmi, pengumuman, dan agenda kegiatan Pemerintah Kabupaten Buton Selatan." },
      { property: "og:title", content: "Berita Pemerintah Kabupaten Buton Selatan" },
      { property: "og:description", content: "Informasi resmi terkini dari Pemerintah Kabupaten Buton Selatan." },
    ],
  }),
  component: BeritaPage,
});

const featured = {
  kategori: "Pengumuman",
  tanggal: "18 April 2026",
  judul: "Pendaftaran PPDB Tahap I Dibuka 1 Mei 2026",
  ringkasan: "Sebanyak 312 sekolah di Kabupaten Buton Selatan akan menerima siswa baru melalui sistem online PPDB terpadu. Orang tua dapat mendaftar melalui akun warga.",
};

const berita = [
  { kategori: "Infrastruktur", tanggal: "16 Apr 2026", judul: "Revitalisasi Trotoar Jalan Sudirman Selesai 90%", ringkasan: "Pekerjaan ditargetkan rampung akhir bulan dengan tambahan jalur disabilitas." },
  { kategori: "Kesehatan", tanggal: "14 Apr 2026", judul: "Vaksinasi Massal di 25 Puskesmas Akhir Pekan Ini", ringkasan: "Layanan gratis untuk warga ber-KTP Kabupaten Buton Selatan, tanpa pendaftaran." },
  { kategori: "Ekonomi", tanggal: "12 Apr 2026", judul: "1.200 UMKM Naik Kelas Lewat Program Inkubasi", ringkasan: "Pelatihan digitalisasi dan akses pembiayaan diperluas hingga ke kelurahan." },
  { kategori: "Lingkungan", tanggal: "10 Apr 2026", judul: "Indeks Kualitas Udara Membaik 12% Sepanjang Q1", ringkasan: "Hasil dari penambahan ruang terbuka hijau dan elektrifikasi transportasi." },
  { kategori: "Sosial", tanggal: "08 Apr 2026", judul: "Bantuan PKH Tahap I Disalurkan ke 48.000 KPM", ringkasan: "Penyaluran melalui rekening bank Himbara, transparan dan akuntabel." },
  { kategori: "Pemerintahan", tanggal: "05 Apr 2026", judul: "Bupati Buka Musrenbang RKPD 2027", ringkasan: "Mengusung tema pembangunan inklusif berbasis data terpadu." },
];

function BeritaPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Pusat Informasi"
        title="Berita & pengumuman resmi."
        description="Sumber tunggal informasi terverifikasi dari seluruh OPD Pemerintah Kabupaten Buton Selatan."
      />

      <section className="container-page py-14">
        {/* Featured */}
        <article className="overflow-hidden rounded-3xl border border-border bg-gradient-primary text-primary-foreground shadow-elevated">
          <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
            <div>
              <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider opacity-90">
                <span className="rounded-full bg-white/15 px-3 py-1">{featured.kategori}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{featured.tanggal}</span>
              </div>
              <h2 className="mt-5 text-balance text-3xl font-bold md:text-4xl">{featured.judul}</h2>
              <p className="mt-4 text-white/85">{featured.ringkasan}</p>
              <a href="#" className="mt-6 inline-flex items-center gap-2 rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-primary">
                Baca selengkapnya <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="hidden items-center justify-center md:flex">
              <div className="grid grid-cols-3 gap-3">
                {[..."PPDB"].map((c, i) => (
                  <div key={i} className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/15 font-display text-3xl font-bold backdrop-blur">
                    {c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Grid */}
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {berita.map((b) => (
            <a key={b.judul} href="#" className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-elevated">
              <div className="flex items-center gap-3 text-xs">
                <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">{b.kategori}</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Calendar className="h-3.5 w-3.5" />{b.tanggal}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold leading-snug group-hover:text-primary">{b.judul}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{b.ringkasan}</p>
              <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Baca <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </a>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
