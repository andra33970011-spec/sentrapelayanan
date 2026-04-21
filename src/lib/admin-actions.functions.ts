// Server functions terproteksi untuk operasi admin sensitif.
// Semua endpoint:
//  - butuh autentikasi (requireSupabaseAuth)
//  - rate-limited per user
//  - validasi input via Zod
//  - mencatat audit_log
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkRateLimit } from "@/integrations/supabase/rate-limit.server";

async function assertSuperAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "super_admin")
    .maybeSingle();
  if (error) throw new Error("Failed to verify role");
  if (!data) throw new Error("Forbidden: super admin only");
}

// ============= UBAH ROLE USER =============
const setRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(["warga", "admin_opd", "super_admin"]),
  opd_id: z.string().uuid().nullable().optional(),
});

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => setRoleSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertSuperAdmin(userId);
    const rl = await checkRateLimit(userId, "set_role", 30, 60);
    if (!rl.ok) throw new Error("Too many requests, try again later");

    // Hapus semua role lama, set role baru (1 user 1 role utama)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
    const { error: insErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.user_id, role: data.role });
    if (insErr) throw new Error(insErr.message);

    // Update opd_id pada profil (nullable)
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ opd_id: data.opd_id ?? null })
      .eq("id", data.user_id);
    if (profErr) throw new Error(profErr.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      aksi: "user.role_changed",
      entitas: "user",
      entitas_id: data.user_id,
      data_sesudah: { role: data.role, opd_id: data.opd_id ?? null } as never,
    });

    return { ok: true };
  });

// ============= ENQUEUE JOB =============
const enqueueSchema = z.object({
  job_type: z.string().min(1).max(64).regex(/^[a-z0-9_.\-]+$/),
  payload: z.record(z.string(), z.unknown()).default({}),
});

export const enqueueJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => enqueueSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertSuperAdmin(userId);
    const rl = await checkRateLimit(userId, "enqueue_job", 60, 60);
    if (!rl.ok) throw new Error("Too many requests");

    const { data: row, error } = await supabaseAdmin
      .from("job_queue")
      .insert({ job_type: data.job_type, payload: data.payload as never, created_by: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, job: row };
  });

// ============= EXPORT DATA (BACKUP) =============
const exportSchema = z.object({
  tabel: z.enum(["profiles", "user_roles", "opd", "permohonan", "permohonan_riwayat", "audit_log", "job_queue"]),
});

export const exportTable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => exportSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await assertSuperAdmin(userId);
    const rl = await checkRateLimit(userId, "export", 10, 60);
    if (!rl.ok) throw new Error("Too many requests");

    const { data: rows, error } = await supabaseAdmin
      .from(data.tabel)
      .select("*")
      .limit(50000);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      aksi: "data.export",
      entitas: "table",
      entitas_id: data.tabel,
      data_sesudah: { count: rows?.length ?? 0 } as never,
    });

    return { tabel: data.tabel, rows: rows ?? [], exported_at: new Date().toISOString() };
  });
