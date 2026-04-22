import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { LayoutGrid, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

type Layanan = {
  id: string; judul: string; slug: string; deskripsi: string | null; persyaratan: string | null;
  alur: string | null; opd_id: string | null;
};
type Opd = { id: string; singkatan: string };

function LayananPage() {
  const [items, setItems] = useState<Layanan[]>([]);
  const [opds, setOpds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("layanan_publik").select("id,judul,slug,deskripsi,persyaratan,alur,opd_id").eq("aktif", true).order("urutan"),
      supabase.from("opd").select("id,singkatan"),
    ]).then(([{ data }, { data: o }]) => {
      setItems((data ?? []) as Layanan[]);
      const m: Record<string, string> = {};
      ((o ?? []) as Opd[]).forEach((x) => { m[x.id] = x.singkatan; });
      setOpds(m);
      setLoading(false);
    });
  }, []);

  return (
    <PageShell>
      <PageHero
        eyebrow="Layanan Publik"
        title="Semua layanan kabupaten dalam satu pintu digital."
        description="Layanan online yang dikelola lintas OPD dengan SLA terukur dan status permohonan yang transparan."
      />
      <section className="container-page py-14">
        {loading && <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Memuat layanan…</div>}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-bold">Katalog layanan sedang disusun</h2>
            <p className="mt-2 text-sm text-muted-foreground">Super Admin dapat menambahkan layanan publik melalui CMS.</p>
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <Link
              key={l.id}
              to="/layanan/$slug"
              params={{ slug: l.slug }}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary transition-transform group-hover:scale-110">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold leading-tight">{l.judul}</h3>
                  {l.opd_id && opds[l.opd_id] && <div className="text-xs text-muted-foreground">{opds[l.opd_id]}</div>}
                </div>
              </div>
              {l.deskripsi && <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{l.deskripsi}</p>}
              <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Lihat detail <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
