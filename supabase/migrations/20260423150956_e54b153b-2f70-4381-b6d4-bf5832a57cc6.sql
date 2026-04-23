-- Tabel rating kepuasan layanan dari warga setelah permohonan selesai
CREATE TABLE public.permohonan_rating (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  permohonan_id UUID NOT NULL UNIQUE,
  pemohon_id UUID NOT NULL,
  skor INTEGER NOT NULL CHECK (skor BETWEEN 1 AND 5),
  komentar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.permohonan_rating ENABLE ROW LEVEL SECURITY;

-- Warga lihat rating miliknya, admin lihat sesuai OPD, super_admin semua
CREATE POLICY "Warga lihat rating sendiri"
ON public.permohonan_rating FOR SELECT
TO authenticated
USING (
  auth.uid() = pemohon_id
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
  OR (
    public.has_role(auth.uid(), 'admin_opd'::app_role)
    AND permohonan_id IN (
      SELECT id FROM public.permohonan WHERE opd_id = public.get_user_opd(auth.uid())
    )
  )
);

-- Warga buat rating untuk permohonan miliknya yang sudah selesai
CREATE POLICY "Warga buat rating sendiri"
ON public.permohonan_rating FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = pemohon_id
  AND permohonan_id IN (
    SELECT id FROM public.permohonan
    WHERE pemohon_id = auth.uid() AND status = 'selesai'::status_permohonan
  )
);

CREATE INDEX idx_permohonan_rating_permohonan ON public.permohonan_rating(permohonan_id);

-- Index untuk pencarian permohonan via NIK (lacak publik)
-- NIK disimpan di profiles, kita perlu join ke permohonan via pemohon_id
CREATE INDEX IF NOT EXISTS idx_profiles_nik ON public.profiles(nik) WHERE nik IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_permohonan_pemohon_tanggal ON public.permohonan(pemohon_id, tanggal_masuk DESC);