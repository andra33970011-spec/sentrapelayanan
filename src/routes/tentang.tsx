import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { Target, Eye, Award, Users } from "lucide-react";

export const Route = createFileRoute("/tentang")({
  head: () => ({
    meta: [
      { title: "Tentang — Pemerintah Kabupaten Buton Selatan" },
      { name: "description", content: "Visi, misi, struktur organisasi, dan profil Pemerintah Kabupaten Buton Selatan." },
      { property: "og:title", content: "Tentang Pemerintah Kabupaten Buton Selatan" },
      { property: "og:description", content: "Profil resmi dan visi misi Pemerintah Kabupaten Buton Selatan." },
    ],
  }),
  component: TentangPage,
});

function TentangPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Profil"
        title="Tentang Pemerintah Kabupaten Buton Selatan."
        description="Bekerja melayani 1,42 juta warga dengan tata kelola modern, transparan, dan berbasis data."
      />

      <section className="container-page py-14">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary"><Eye className="h-5 w-5" /></div>
            <h3 className="mt-5 text-xl font-semibold">Visi</h3>
            <p className="mt-3 text-muted-foreground">
              Mewujudkan Kabupaten Buton Selatan sebagai kota cerdas, inklusif, dan berkelanjutan melalui pemerintahan yang melayani dan berbasis data.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary"><Target className="h-5 w-5" /></div>
            <h3 className="mt-5 text-xl font-semibold">Misi</h3>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
              <li>Mensentralisasi layanan publik dalam satu portal terpadu.</li>
              <li>Membangun tata kelola data terbuka dan akuntabel.</li>
              <li>Meningkatkan kualitas hidup warga lintas sektor.</li>
              <li>Memperluas partisipasi publik dalam pembangunan.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-3xl bg-surface p-10">
          <h2 className="text-2xl font-bold">Struktur Pemerintahan</h2>
          <p className="mt-2 text-muted-foreground">Kabupaten Buton Selatan dipimpin oleh Bupati dan Wakil Bupati dengan dukungan 28 Organisasi Perangkat Daerah (OPD).</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { nama: "Adios", jabatan: "Bupati" },
              { nama: "La Ode Risawal", jabatan: "Wakil Bupati" },
              { nama: "Ir. Hendra Kurnia", jabatan: "Sekretaris Daerah" },
            ].map((p) => (
              <div key={p.nama} className="rounded-2xl border border-border bg-card p-6 text-center shadow-soft">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-2xl font-bold text-primary-foreground">
                  {p.nama.split(" ").map(s=>s[0]).slice(0,2).join("")}
                </div>
                <div className="mt-4 font-semibold">{p.nama}</div>
                <div className="text-sm text-muted-foreground">{p.jabatan}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary"><Award className="h-5 w-5" /></div>
            <h3 className="mt-5 text-xl font-semibold">Penghargaan</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• WTP — BPK RI (8 tahun berturut-turut)</li>
              <li>• Smart City Award 2025</li>
              <li>• Open Data Index Tertinggi Jawa</li>
              <li>• Penghargaan Pelayanan Prima — Kemenpan RB</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary"><Users className="h-5 w-5" /></div>
            <h3 className="mt-5 text-xl font-semibold">Aparatur</h3>
            <p className="mt-3 text-muted-foreground">12.480 ASN melayani warga di 28 OPD, 12 kecamatan, dan 78 kelurahan, didukung sistem manajemen kinerja berbasis digital.</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
