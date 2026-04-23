import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { LayoutGrid, ChevronRight, ChevronLeft, Search, X, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type LayananSearch = { q?: string; opd?: string; page: number };

export const Route = createFileRoute("/layanan")({
  validateSearch: (search: Record<string, unknown>): LayananSearch => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
    opd: typeof search.opd === "string" && search.opd.length > 0 ? search.opd : undefined,
    page: typeof search.page === "number" && search.page > 0 ? Math.floor(search.page) : 1,
  }),
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
type Opd = { id: string; singkatan: string; nama: string };

const PAGE_SIZE = 9;

function LayananPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/layanan" });

  const [items, setItems] = useState<Layanan[]>([]);
  const [opds, setOpds] = useState<Opd[]>([]);
  const [loading, setLoading] = useState(true);
  const [qInput, setQInput] = useState(search.q ?? "");

  useEffect(() => { setQInput(search.q ?? ""); }, [search.q]);

  useEffect(() => {
    Promise.all([
      supabase.from("layanan_publik").select("id,judul,slug,deskripsi,persyaratan,alur,opd_id").eq("aktif", true).order("urutan"),
      supabase.from("opd").select("id,singkatan,nama").order("singkatan"),
    ]).then(([{ data }, { data: o }]) => {
      setItems((data ?? []) as Layanan[]);
      setOpds((o ?? []) as Opd[]);
      setLoading(false);
    });
  }, []);

  const opdMap = useMemo(() => {
    const m: Record<string, Opd> = {};
    opds.forEach((o) => { m[o.id] = o; });
    return m;
  }, [opds]);

  // Resolve filter param: bisa berupa singkatan (dari /opd/$singkatan) atau UUID (legacy)
  const activeOpd = useMemo<Opd | null>(() => {
    if (!search.opd) return null;
    return opds.find((o) => o.singkatan === search.opd || o.id === search.opd) ?? null;
  }, [opds, search.opd]);

  const filtered = useMemo(() => {
    const q = (search.q ?? "").trim().toLowerCase();
    return items.filter((l) => {
      if (activeOpd && l.opd_id !== activeOpd.id) return false;
      if (q && !(`${l.judul} ${l.deskripsi ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, search.q, activeOpd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(search.page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Setter selalu memakai SINGKATAN agar URL bisa di-share & cocok dengan /opd/$singkatan
  const setOpd = (singkatan: string | undefined) => {
    navigate({ search: (prev: LayananSearch) => ({ ...prev, opd: singkatan, page: 1 }), replace: true });
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ search: (prev: LayananSearch) => ({ ...prev, q: qInput.trim() || undefined, page: 1 }), replace: true });
  };

  const goPage = (p: number) => {
    navigate({ search: (prev: LayananSearch) => ({ ...prev, page: p }), replace: true });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearAll = () => {
    setQInput("");
    navigate({ search: { page: 1 }, replace: true });
  };

  const hasFilter = !!(search.q || search.opd);

  return (
    <PageShell>
      <PageHero
        eyebrow="Layanan Publik"
        title="Semua layanan kabupaten dalam satu pintu digital."
        description="Layanan online yang dikelola lintas OPD dengan SLA terukur dan status permohonan yang transparan."
      />

      <section className="container-page py-10">
        {/* Banner OPD aktif */}
        {activeOpd && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-primary">
              <Building2 className="h-4 w-4" />
              <span>Memfilter layanan dari <strong>{activeOpd.nama}</strong> ({activeOpd.singkatan})</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/opd/$singkatan"
                params={{ singkatan: activeOpd.singkatan }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Lihat profil OPD →
              </Link>
              <button onClick={() => setOpd(undefined)} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <X className="h-3 w-3" /> Hapus filter
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft md:p-5">
          <form onSubmit={submitSearch} className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                placeholder="Cari layanan berdasarkan nama atau deskripsi…"
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

          {/* OPD Filter chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> Filter OPD:
            </div>
            <button
              onClick={() => setOpd(undefined)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !activeOpd ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              Semua
            </button>
            {opds.map((o) => (
              <button
                key={o.id}
                onClick={() => setOpd(o.singkatan)}
                title={o.nama}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  activeOpd?.id === o.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {o.singkatan}
              </button>
            ))}
            {hasFilter && (
              <button onClick={clearAll} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <X className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Status hasil */}
        {!loading && (
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Menampilkan <span className="font-semibold text-foreground">{pageItems.length}</span> dari {filtered.length} layanan
              {hasFilter && " (tersaring)"}
            </span>
            {totalPages > 1 && <span>Halaman {currentPage} / {totalPages}</span>}
          </div>
        )}
      </section>

      <section className="container-page pb-14">
        {loading && <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">Memuat layanan…</div>}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <LayoutGrid className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-bold">Katalog layanan sedang disusun</h2>
            <p className="mt-2 text-sm text-muted-foreground">Super Admin dapat menambahkan layanan publik melalui CMS.</p>
          </div>
        )}

        {!loading && items.length > 0 && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Search className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="mt-3 font-display text-xl font-bold">Tidak ada layanan yang cocok</h2>
            <p className="mt-2 text-sm text-muted-foreground">Coba ubah kata kunci atau hapus filter OPD.</p>
            <button onClick={clearAll} className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Reset filter
            </button>
          </div>
        )}

        {pageItems.length > 0 && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((l) => (
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
                    {l.opd_id && opdMap[l.opd_id] && <div className="text-xs text-muted-foreground">{opdMap[l.opd_id].singkatan}</div>}
                  </div>
                </div>
                {l.deskripsi && <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{l.deskripsi}</p>}
                <span className="mt-auto pt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Lihat detail <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-1">
            <button
              onClick={() => goPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
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
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-card px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 hover:bg-muted"
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>
    </PageShell>
  );
}
