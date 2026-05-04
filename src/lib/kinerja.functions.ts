import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type KinerjaOpd = {
  opd_id: string;
  singkatan: string;
  nama: string;
  total: number;
  selesai: number;
  diproses: number;
  ditolak: number;
  tepat_waktu: number;
  rata_rating: number | null;
  jumlah_rating: number;
};

export type KinerjaRingkasan = {
  total_permohonan: number;
  total_selesai: number;
  total_tepat_waktu: number;
  rata_rating_global: number | null;
  jumlah_rating_global: number;
  per_opd: KinerjaOpd[];
};

export const getKinerja = createServerFn({ method: "GET" }).handler(
  async (): Promise<KinerjaRingkasan> => {
    const [{ data: opds }, { data: permohonan }, { data: ratings }] = await Promise.all([
      supabaseAdmin.from("opd").select("id,singkatan,nama").order("singkatan"),
      supabaseAdmin.from("permohonan").select("id,opd_id,status,tenggat,updated_at"),
      supabaseAdmin.from("permohonan_rating").select("skor,permohonan_id"),
    ]);

    const opdList = opds ?? [];
    const reqs = permohonan ?? [];
    const rs = ratings ?? [];

    // Map permohonan_id → opd_id (untuk agregasi rating per OPD)
    const reqOpdMap = new Map<string, string>();
    reqs.forEach((r) => r.opd_id && reqOpdMap.set(r.id, r.opd_id));

    const ratingPerOpd = new Map<string, { sum: number; count: number }>();
    let sumGlobal = 0;
    let countGlobal = 0;
    rs.forEach((r) => {
      const opdId = reqOpdMap.get(r.permohonan_id);
      if (!opdId) return;
      const cur = ratingPerOpd.get(opdId) ?? { sum: 0, count: 0 };
      cur.sum += r.skor;
      cur.count += 1;
      ratingPerOpd.set(opdId, cur);
      sumGlobal += r.skor;
      countGlobal += 1;
    });

    const per_opd: KinerjaOpd[] = opdList.map((o) => {
      const list = reqs.filter((r) => r.opd_id === o.id);
      const selesai = list.filter((r) => r.status === "selesai").length;
      const ditolak = list.filter((r) => r.status === "ditolak").length;
      const diproses = list.length - selesai - ditolak;
      const tepatWaktu = list.filter((r) => {
        if (r.status !== "selesai" || !r.tenggat) return false;
        return new Date(r.updated_at).getTime() <= new Date(r.tenggat).getTime();
      }).length;
      const rt = ratingPerOpd.get(o.id);
      return {
        opd_id: o.id,
        singkatan: o.singkatan,
        nama: o.nama,
        total: list.length,
        selesai,
        diproses,
        ditolak,
        tepat_waktu: tepatWaktu,
        rata_rating: rt && rt.count > 0 ? +(rt.sum / rt.count).toFixed(2) : null,
        jumlah_rating: rt?.count ?? 0,
      };
    });

    const total_selesai = per_opd.reduce((s, x) => s + x.selesai, 0);
    const total_tepat_waktu = per_opd.reduce((s, x) => s + x.tepat_waktu, 0);

    return {
      total_permohonan: reqs.length,
      total_selesai,
      total_tepat_waktu,
      rata_rating_global: countGlobal > 0 ? +(sumGlobal / countGlobal).toFixed(2) : null,
      jumlah_rating_global: countGlobal,
      per_opd: per_opd.sort((a, b) => b.total - a.total),
    };
  },
);
