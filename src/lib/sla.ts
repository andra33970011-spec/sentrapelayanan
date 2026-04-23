// Helper SLA & countdown tenggat untuk permohonan.
// Dipakai bersama oleh halaman warga dan detail layanan.

export type SlaInfo = {
  /** Sisa hari kerja kasar (kalender) menuju tenggat. Negatif = lewat. */
  sisaHari: number;
  /** Apakah sudah lewat tenggat */
  lewat: boolean;
  /** Apakah dekat tenggat (≤ 2 hari) */
  hampirJatuhTempo: boolean;
  /** Label ringkas: "Tersisa 3 hari", "Lewat 1 hari", "Hari ini" */
  label: string;
  /** Token semantik untuk styling */
  tone: "ok" | "warn" | "danger" | "done";
};

export function hitungSla(
  tenggat: string | null,
  status: "baru" | "diproses" | "selesai" | "ditolak",
): SlaInfo | null {
  if (!tenggat) return null;
  const target = new Date(tenggat).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const sisaHari = Math.ceil(diffMs / 86_400_000);

  if (status === "selesai" || status === "ditolak") {
    return {
      sisaHari,
      lewat: false,
      hampirJatuhTempo: false,
      label: status === "selesai" ? "Selesai" : "Ditutup",
      tone: "done",
    };
  }

  const lewat = sisaHari < 0;
  const hampirJatuhTempo = sisaHari >= 0 && sisaHari <= 2;

  let label: string;
  if (sisaHari === 0) label = "Jatuh tempo hari ini";
  else if (lewat) label = `Lewat ${Math.abs(sisaHari)} hari`;
  else label = `Tersisa ${sisaHari} hari`;

  return {
    sisaHari,
    lewat,
    hampirJatuhTempo,
    label,
    tone: lewat ? "danger" : hampirJatuhTempo ? "warn" : "ok",
  };
}

export const SLA_TONE_CLASS: Record<NonNullable<SlaInfo>["tone"], string> = {
  ok: "bg-success/10 text-success border-success/30",
  warn: "bg-gold/15 text-gold-foreground border-gold/40",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
  done: "bg-muted text-muted-foreground border-border",
};
