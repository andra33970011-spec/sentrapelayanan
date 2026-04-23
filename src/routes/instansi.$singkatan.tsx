import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { Building2, ChevronRight, ChevronLeft, LayoutGrid, Search, X, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OpdSearch = { q?: string; page: number };

export const Route = createFileRoute("/instansi/$singkatan")({
  validateSearch: (search: Record<string, unknown>): OpdSearch => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
    page: typeof search.page === "number" && search.page > 0 ? Math.floor(search.page) : 1,
  }),
  head: ({ params }) => ({
    meta: [
      { title: `OPD ${params.singkatan} — Pemerintah Kabupaten Buton Selatan` },
      { name: "description", content: `Profil dan daftar layanan publik yang dikelola oleh ${params.singkatan} Kabupaten Buton Selatan.` },
      { property: "og:title", content: `OPD ${params.singkatan} — Buton Selatan` },
      { property: "og:description", content: `Layanan publik yang dikelola ${params.singkatan}.` },
    ],
  }),
  component: OpdDetailPage,
  notFoundComponent: () => {
    const { singkatan } = Route.useParams();
    return (
      <PageShell>
        <section className="container-page py-20 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
          <h1 className="mt-4 font-display text-2xl font-bold">OPD "{singkatan}" tidak ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">Periksa kembali singkatan OPD pada URL.</p>
          <Link to="/layanan" className="mt-6 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar OPD
          </Link>
        </section>
      </PageShell>
    );
  },
});

type Opd = { id: string; singkatan: string; nama: string; kategori: string[] };
type Layanan = { id: string; judul: string; slug: string; deskripsi: string | null };

const PAGE_SIZE = 6;

function OpdDetailPage() {
  const { singkatan } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/instansi/$singkatan" });

  const [opd, setOpd] = useState<Opd | null>(null);
  const [layanan, setLayanan] = useState<Layanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [qInput, setQInput] = useState(search.q ?? "");

  useEffect(() => { setQInput(search.q ?? ""); }, [search.q]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: o } = await supabase.from("opd").select("id,singkatan,nama,kategori").eq("singkatan", singkatan).maybeSingle();
      if (!o) { setNotFoundFlag(true); setLoading(false); return; }
      setOpd(o as Opd);
      const { data: l } = await supabase
        .from("layanan_publik")
        .select("id,judul,slug,deskripsi")
        .eq("aktif", true)
        .eq("opd_id", (o as Opd).id)
        .order("urutan");
      setLayanan((l ?? []) as Layanan[]);
      setLoading(false);
    })();
  }, [singkatan]);

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    if (!q) return layanan;
    return layanan.filter((l) => `${l.judul} ${l.deskripsi ?? ""}`.toLowerCase().includes(q));
  }, [layanan, search.q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(search.page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: { q: qInput.trim() || undefined, page: 1 }, replace: true });
  };

  const goPage = (p: number) => {
    navigate({ search: (prev: OpdSearch) => ({ ...prev, page: p }), replace: true });
  };

  if (notFoundFlag) throw notFound();

  return (
    <PageShell>
      <PageHero
        eyebrow={opd ? "OPD" : "Memuat…"}
        title={opd ? opd.nama : "Memuat profil OPD…"}
        description={opd ? `Singkatan resmi: ${opd.singkatan}` : undefined}
      />

      <section className="container-page py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/layanan" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar OPD
          </Link>
          {opd && (
            <Link
              to="/layanan"
              search={{ opd: opd.singkatan, page: 1 } as never}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-soft/70"
            >
              Lihat di katalog layanan <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {opd && opd.kategori.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {opd.kategori.map((k) => (
              <span key={k} className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{k}</span>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-soft md:p-5">
          <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder={`Cari layanan di ${opd?.singkatan ?? "OPD ini"}…`}
                className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted-foreground"
              />
              {qInput && (
                <button type="button" onClick={() => setQInput("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button type="submit" className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Cari
            </button>
          </form>
        </div>

        {!loading && (
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Menampilkan <span className="font-semibold text-foreground">{pageItems.length}</span> dari {filtered.length} layanan
              {search.q && " (tersaring)"}
            </span>
            <span>Halaman {currentPage} / {totalPages}</span>
          </div>
        )}
      </section>

      <section className="container-page pb-14">
        {loading && <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Memuat layanan…</div>}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-bold">
              {layanan.length === 0 ? "Belum ada layanan terdaftar" : "Tidak ada layanan yang cocok"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {layanan.length === 0 ? "OPD ini belum mempublikasikan layanan." : "Coba ubah kata kunci pencarian."}
            </p>
          </div>
        )}

        {pageItems.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((l) => (
              <Link
                key={l.id}
                to="/permohonan/baru"
                search={{ layanan: l.slug } as never}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-soft text-primary transition-transform group-hover:scale-110">
                    <LayoutGrid className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold leading-tight">{l.judul}</h3>
                </div>
                {l.deskripsi && <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{l.deskripsi}</p>}
                <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Ajukan permohonan <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-1">
            <button
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => goPage(p)}
                className={`h-9 w-9 rounded-lg text-sm font-medium ${
                  p === currentPage ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => goPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </PageShell>
  );
}
