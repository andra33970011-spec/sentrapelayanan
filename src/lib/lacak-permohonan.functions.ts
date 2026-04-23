// Server function publik: lacak permohonan via NIK (tanpa login).
// Pakai service-role utk bypass RLS, tetapi rate-limited & data dipangkas.
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkRateLimit } from "@/integrations/supabase/rate-limit.server";

const inputSchema = z.object({
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/u, "NIK harus 16 digit angka"),
});

export type LacakPermohonanItem = {
  id: string;
  kode: string;
  judul: string;
  kategori: string;
  status: "baru" | "diproses" | "selesai" | "ditolak";
  tanggal_masuk: string;
  tenggat: string | null;
  opd: { singkatan: string; nama: string } | null;
};

export const lacakPermohonanByNik = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<{ items: LacakPermohonanItem[]; nama: string | null }> => {
    // Rate limit per IP: 10 req / menit
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anon";
    const rl = await checkRateLimit(ip, "lacak-nik", 10, 60);
    if (!rl.ok) {
      throw new Error("Terlalu banyak percobaan. Coba lagi dalam 1 menit.");
    }

    // Cari profil dengan NIK ini (NIK biasanya unik per warga, tapi
    // kita ambil semua match untuk berjaga-jaga jika ada duplikat).
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("profiles")
      .select("id, nama_lengkap")
      .eq("nik", data.nik);
    if (profErr) throw new Error("Gagal mencari data: " + profErr.message);
    if (!profiles || profiles.length === 0) {
      return { items: [], nama: null };
    }

    const ids = profiles.map((p) => p.id);
    const nama = profiles[0]?.nama_lengkap ?? null;

    const { data: rows, error } = await supabaseAdmin
      .from("permohonan")
      .select(
        "id, kode, judul, kategori, status, tanggal_masuk, tenggat, opd:opd_id(singkatan, nama)",
      )
      .in("pemohon_id", ids)
      .order("tanggal_masuk", { ascending: false })
      .limit(100);
    if (error) throw new Error("Gagal memuat permohonan: " + error.message);

    return {
      items: (rows ?? []) as unknown as LacakPermohonanItem[],
      nama,
    };
  });
