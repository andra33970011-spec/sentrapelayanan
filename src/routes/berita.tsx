import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { Calendar, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

type Berita = { id: string; judul: string; ringkasan: string | null; isi: string; gambar_url: string | null; published_at: string | null };

function BeritaPage() {
  const [items, setItems] = useState<Berita[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("berita")
      .select("id,judul,ringkasan,isi,gambar_url,published_at")
      .eq("status", "terbit")
      .order("published_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        setItems((data ?? []) as Berita[]);
        setLoading(false);
      });
  }, []);

  const featured = items[0];
  const rest = items.slice(1);

  return (
    <PageShell>
      <PageHero
        eyebrow="Pusat Informasi"
        title="Berita & pengumuman resmi."
        description="Sumber tunggal informasi terverifikasi dari seluruh OPD Pemerintah Kabupaten Buton Selatan."
      />

      <section className="container-page py-14">
        {loading && <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Memuat berita…</div>}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <h2 className="font-display text-xl font-bold">Belum ada berita yang terbit</h2>
            <p className="mt-2 text-sm text-muted-foreground">Berita akan muncul di sini setelah Super Admin mempublikasikannya melalui CMS.</p>
          </div>
        )}

        {featured && (
          <article className="overflow-hidden rounded-3xl border border-border bg-gradient-primary text-primary-foreground shadow-elevated">
            <div className="grid gap-8 p-8 md:grid-cols-2 md:p-12">
              <div>
                <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wider opacity-90">
                  <span className="rounded-full bg-white/15 px-3 py-1">Pengumuman</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {featured.published_at ? new Date(featured.published_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "—"}
                  </span>
                </div>
                <h2 className="mt-5 text-balance text-3xl font-bold md:text-4xl">{featured.judul}</h2>
                {featured.ringkasan && <p className="mt-4 text-white/85">{featured.ringkasan}</p>}
              </div>
              <div className="hidden items-center justify-center md:flex">
                {featured.gambar_url ? (
                  <img src={featured.gambar_url} alt="" className="max-h-64 w-full rounded-2xl object-cover" />
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {[..."INFO"].slice(0, 3).map((c, i) => (
                      <div key={i} className="flex h-20 w-20 items-center justify-center rounded-xl bg-white/15 font-display text-3xl font-bold backdrop-blur">{c}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </article>
        )}

        {rest.length > 0 && (
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((b) => (
              <article key={b.id} className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-shadow hover:shadow-elevated">
                <div className="flex items-center gap-3 text-xs">
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 font-medium text-primary">Berita</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {b.published_at ? new Date(b.published_at).toLocaleDateString("id-ID") : "—"}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold leading-snug group-hover:text-primary">{b.judul}</h3>
                {b.ringkasan && <p className="mt-2 flex-1 text-sm text-muted-foreground">{b.ringkasan}</p>}
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Baca <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </article>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
