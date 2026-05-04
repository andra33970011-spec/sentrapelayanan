import { useEffect, useState } from "react";
import { Star, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

export function RatingForm({ permohonanId }: { permohonanId: string }) {
  const { user } = useAuth();
  const [skor, setSkor] = useState(0);
  const [hover, setHover] = useState(0);
  const [komentar, setKomentar] = useState("");
  const [loading, setLoading] = useState(false);
  const [existing, setExisting] = useState<{ skor: number; komentar: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) { setChecking(false); return; }
    supabase
      .from("permohonan_rating")
      .select("skor,komentar")
      .eq("permohonan_id", permohonanId)
      .eq("pemohon_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setExisting(data);
        setChecking(false);
      });
  }, [permohonanId, user]);

  if (checking) return null;

  if (existing) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-success">
          <CheckCircle2 className="h-4 w-4" /> Terima kasih atas penilaian Anda
        </div>
        <div className="mt-2 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className={`h-4 w-4 ${i <= existing.skor ? "fill-gold text-gold" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        {existing.komentar && <p className="mt-2 text-sm text-muted-foreground italic">"{existing.komentar}"</p>}
      </div>
    );
  }

  const submit = async () => {
    if (!user || skor < 1) {
      toast.error("Pilih jumlah bintang terlebih dahulu");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("permohonan_rating").insert({
      permohonan_id: permohonanId,
      pemohon_id: user.id,
      skor,
      komentar: komentar.trim() || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Gagal menyimpan rating: " + error.message);
      return;
    }
    toast.success("Penilaian berhasil dikirim");
    setExisting({ skor, komentar: komentar || null });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h4 className="font-semibold">Beri penilaian layanan ini</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Penilaian Anda membantu meningkatkan kualitas pelayanan publik.
      </p>
      <div className="mt-3 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setSkor(i)}
            className="rounded p-1 transition-transform hover:scale-110"
            aria-label={`Beri ${i} bintang`}
          >
            <Star className={`h-7 w-7 ${i <= (hover || skor) ? "fill-gold text-gold" : "text-muted-foreground/40"}`} />
          </button>
        ))}
      </div>
      <textarea
        value={komentar}
        onChange={(e) => setKomentar(e.target.value)}
        placeholder="Komentar (opsional)…"
        maxLength={500}
        rows={3}
        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        onClick={submit}
        disabled={loading || skor < 1}
        className="mt-3 inline-flex h-10 items-center rounded-md bg-gradient-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Menyimpan…" : "Kirim Penilaian"}
      </button>
    </div>
  );
}
