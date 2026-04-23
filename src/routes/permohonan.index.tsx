import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Inbox, Clock, Star } from "lucide-react";
import { toast } from "sonner";
import { PageShell, PageHero } from "@/components/site/PageShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  STATUS_LABEL,
  STATUS_TONE,
  fmtTanggal,
  type StatusPermohonan,
} from "@/lib/permohonan";
import { hitungSla, SLA_TONE_CLASS } from "@/lib/sla";

export const Route = createFileRoute("/permohonan/")({
  head: () => ({
    meta: [
      { title: "Permohonan Saya — Portal Buton Selatan" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ListPage,
});

type Row = {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  status: StatusPermohonan;
  tanggal_masuk: string;
  tenggat: string | null;
  opd: { singkatan: string } | null;
};

type RatingRow = { permohonan_id: string; skor: number };

function ListPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Row[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loadingList, setLoadingList] = useState(true);
  const [ratingFor, setRatingFor] = useState<Row | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  async function load(uid: string) {
    setLoadingList(true);
    const { data } = await supabase
      .from("permohonan")
      .select(
        "id, kode, judul, kategori, status, tanggal_masuk, tenggat, opd:opd_id(singkatan)",
      )
      .eq("pemohon_id", uid)
      .order("tanggal_masuk", { ascending: false });
    const list = (data ?? []) as unknown as Row[];
    setItems(list);

    const ids = list.map((p) => p.id);
    if (ids.length > 0) {
      const { data: rts } = await supabase
        .from("permohonan_rating")
        .select("permohonan_id, skor")
        .in("permohonan_id", ids);
      const map: Record<string, number> = {};
      ((rts ?? []) as RatingRow[]).forEach((r) => {
        map[r.permohonan_id] = r.skor;
      });
      setRatings(map);
    } else {
      setRatings({});
    }
    setLoadingList(false);
  }

  useEffect(() => {
    if (!user) return;
    load(user.id);
  }, [user]);

  return (
    <PageShell>
      <PageHero
        eyebrow="Akun Saya"
        title="Permohonan Saya"
        description="Pantau status pengajuan layanan publik Anda."
      />
      <section className="container-page py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Daftar Permohonan</h2>
          <Link
            to="/permohonan/baru"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft"
          >
            <Plus className="h-4 w-4" /> Ajukan Baru
          </Link>
        </div>

        {loadingList ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            Memuat…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Inbox className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 font-display text-lg font-semibold">
              Belum ada permohonan
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Mulai ajukan permohonan layanan publik pertama Anda.
            </p>
            <Link
              to="/permohonan/baru"
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Ajukan Baru
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => {
              const sla = hitungSla(p.tenggat, p.status);
              const ratedScore = ratings[p.id];
              const canRate = p.status === "selesai" && ratedScore == null;
              return (
                <li
                  key={p.id}
                  className="rounded-xl border border-border bg-card p-4 shadow-soft"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{p.kode}</span>
                        <span>·</span>
                        <span>{p.kategori}</span>
                        {p.opd && (
                          <>
                            <span>·</span>
                            <span>{p.opd.singkatan}</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-1 font-display text-base font-semibold text-foreground">
                        {p.judul}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Diajukan {fmtTanggal(p.tanggal_masuk)}
                        </span>
                        {sla && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${SLA_TONE_CLASS[sla.tone]}`}
                          >
                            <Clock className="h-3 w-3" />
                            {sla.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_TONE[p.status]}`}
                      >
                        {STATUS_LABEL[p.status]}
                      </span>
                      {ratedScore != null && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-gold-foreground">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 ${i < ratedScore ? "fill-gold text-gold" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </span>
                      )}
                      {canRate && (
                        <button
                          type="button"
                          onClick={() => setRatingFor(p)}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
                        >
                          <Star className="h-3.5 w-3.5" /> Beri rating
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {ratingFor && user && (
        <RatingDialog
          permohonan={ratingFor}
          userId={user.id}
          onClose={() => setRatingFor(null)}
          onSubmitted={() => {
            setRatingFor(null);
            void load(user.id);
          }}
        />
      )}
    </PageShell>
  );
}

function RatingDialog({
  permohonan,
  userId,
  onClose,
  onSubmitted,
}: {
  permohonan: Row;
  userId: string;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const [skor, setSkor] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (skor < 1) {
      toast.error("Pilih skor 1-5 bintang");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("permohonan_rating").insert({
      permohonan_id: permohonan.id,
      pemohon_id: userId,
      skor,
      komentar: komentar.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Terima kasih atas penilaian Anda!");
    onSubmitted();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-bold">Beri Penilaian</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {permohonan.kode} · {permohonan.judul}
        </p>

        <div className="mt-5">
          <label className="block text-sm font-medium">Seberapa puas Anda?</label>
          <div className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSkor(n)}
                aria-label={`${n} bintang`}
                className="rounded-md p-1 transition hover:scale-110"
              >
                <Star
                  className={`h-9 w-9 ${n <= skor ? "fill-gold text-gold" : "text-muted-foreground/40"}`}
                />
              </button>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="block text-sm font-medium">Saran (opsional)</span>
          <textarea
            rows={3}
            maxLength={500}
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            placeholder="Ceritakan pengalaman Anda untuk membantu peningkatan layanan…"
            className="mt-1.5 w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </label>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-border bg-background px-4 text-sm font-medium hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || skor < 1}
            className="h-10 rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground shadow-soft disabled:opacity-50"
          >
            {busy ? "Mengirim…" : "Kirim Penilaian"}
          </button>
        </div>
      </div>
    </div>
  );
}
