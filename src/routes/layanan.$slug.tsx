import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageShell } from "@/components/site/PageShell";
import { ArrowLeft, ChevronRight, ClipboardList, ListChecks, Building2, FileText, Loader2 } from "lucide-react";
import { layananBySlugQueryOptions, opdByIdQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/layanan/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Layanan ${params.slug} — Pemerintah Kabupaten Buton Selatan` },
      { name: "description", content: "Detail layanan publik: deskripsi, persyaratan, dan alur lengkap." },
    ],
  }),
  loader: async ({ params, context: { queryClient } }) => {
    const item = await queryClient.ensureQueryData(layananBySlugQueryOptions(params.slug));
    if (item?.opd_id) {
      queryClient.ensureQueryData(opdByIdQueryOptions(item.opd_id));
    }
  },
  pendingComponent: () => (
    <PageShell>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container-page py-12 md:py-16">
          <div className="flex items-center gap-2 text-white/85">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat…
          </div>
        </div>
      </section>
    </PageShell>
  ),
  component: LayananDetailPage,
});

function LayananDetailPage() {
  const { slug } = Route.useParams();
  const { data: item } = useSuspenseQuery(layananBySlugQueryOptions(slug));
  const { data: opd } = useSuspenseQuery(opdByIdQueryOptions(item?.opd_id ?? ""));

  const notFoundFlag = !item;

  return (
    <PageShell>
      <section className="bg-gradient-hero text-primary-foreground">
        <div className="container-page py-12 md:py-16">
          <Link to="/layanan" className="inline-flex items-center gap-1 text-sm text-white/85 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar layanan
          </Link>
          {notFoundFlag ? (
            <h1 className="mt-6 text-3xl font-bold md:text-4xl">Layanan tidak ditemukan</h1>
          ) : (
            <>
              <div className="mt-4 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wide backdrop-blur">
                Layanan Publik
              </div>
              <h1 className="mt-3 max-w-3xl text-balance text-3xl font-bold md:text-5xl">{item.judul}</h1>
              {opd && (
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-white/85">
                  <Building2 className="h-4 w-4" /> Penanggung jawab: <span className="font-semibold">{opd.singkatan}</span> — {opd.nama}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      {notFoundFlag && (
        <section className="container-page py-14">
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">Layanan dengan tautan ini tidak tersedia atau telah dinonaktifkan.</p>
            <Link to="/layanan" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Lihat semua layanan <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {item && (
        <section className="container-page grid gap-6 py-12 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {item.deskripsi && (
              <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <FileText className="h-5 w-5 text-primary" /> Deskripsi Layanan
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.deskripsi}</p>
              </article>
            )}

            {item.persyaratan && (
              <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <ClipboardList className="h-5 w-5 text-primary" /> Persyaratan
                </h2>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">{item.persyaratan}</pre>
              </article>
            )}

            {item.alur && (
              <article className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <ListChecks className="h-5 w-5 text-primary" /> Alur Layanan
                </h2>
                <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted-foreground">{item.alur}</pre>
              </article>
            )}

            {!item.deskripsi && !item.persyaratan && !item.alur && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
                Detail layanan belum tersedia.
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-2xl border border-border bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-elevated">
              <h3 className="font-display text-lg font-bold">Siap mengajukan?</h3>
              <p className="mt-2 text-sm text-primary-foreground/85">
                Ajukan permohonan online dan pantau statusnya secara real-time.
              </p>
              <Link
                to="/permohonan/baru"
                search={{ layanan: item.slug } as never}
                className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-md bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-white/95 transition-colors"
              >
                Ajukan Permohonan <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            {opd && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">OPD Pengelola</h3>
                <p className="mt-2 font-semibold">{opd.singkatan}</p>
                <p className="text-sm text-muted-foreground">{opd.nama}</p>
              </div>
            )}
          </aside>
        </section>
      )}
    </PageShell>
  );
}
