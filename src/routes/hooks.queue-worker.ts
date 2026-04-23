// Worker pemroses job_queue. Dipanggil tiap menit oleh pg_cron.
// Otentikasi via Bearer ANON_KEY (cron menyimpan token di SQL).
// Worker mengambil hingga 10 job pending/failed yang siap dijalankan,
// menjalankannya satu per satu, dan mengupdate status.
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const WORKER_SECRET = process.env.QUEUE_WORKER_SECRET;

type JobRow = {
  id: string;
  job_type: string;
  payload: Record<string, unknown>;
  attempts: number;
  max_attempts: number;
};

// Handler tiap tipe job. Tambah handler baru di sini.
const handlers: Record<string, (payload: Record<string, unknown>) => Promise<unknown>> = {
  "noop": async () => ({ ok: true }),
  "audit.cleanup": async () => {
    // Hapus audit_log >180 hari
    const cutoff = new Date(Date.now() - 180 * 86400_000).toISOString();
    const { count, error } = await supabaseAdmin
      .from("audit_log")
      .delete({ count: "exact" })
      .lt("created_at", cutoff);
    if (error) throw new Error(error.message);
    return { deleted: count ?? 0 };
  },
  "ratelimit.cleanup": async () => {
    const cutoff = new Date(Date.now() - 3600_000).toISOString();
    const { count, error } = await supabaseAdmin
      .from("rate_limit")
      .delete({ count: "exact" })
      .lt("window_start", cutoff);
    if (error) throw new Error(error.message);
    return { deleted: count ?? 0 };
  },
};

async function processJob(job: JobRow) {
  const handler = handlers[job.job_type];
  const startedAt = new Date().toISOString();
  await supabaseAdmin
    .from("job_queue")
    .update({ status: "running", started_at: startedAt, attempts: job.attempts + 1 })
    .eq("id", job.id);

  if (!handler) {
    await supabaseAdmin.from("job_queue").update({
      status: "dead",
      finished_at: new Date().toISOString(),
      error: `Unknown job_type: ${job.job_type}`,
    }).eq("id", job.id);
    return;
  }

  try {
    const result = await handler(job.payload ?? {});
    await supabaseAdmin.from("job_queue").update({
      status: "success",
      finished_at: new Date().toISOString(),
      result: result as never,
      error: null,
    }).eq("id", job.id);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isFinal = job.attempts + 1 >= job.max_attempts;
    await supabaseAdmin.from("job_queue").update({
      status: isFinal ? "dead" : "failed",
      finished_at: new Date().toISOString(),
      error: msg,
    }).eq("id", job.id);
  }
}

export const Route = createFileRoute("/hooks/queue-worker")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        const token = auth.replace(/^Bearer\s+/i, "");
        if (!WORKER_SECRET || token !== WORKER_SECRET) {
          return new Response("Unauthorized", { status: 401 });
        }

        // Ambil sampai 10 job siap proses
        const { data: jobs, error } = await supabaseAdmin
          .from("job_queue")
          .select("*")
          .in("status", ["pending", "failed"])
          .lte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(10);
        if (error) {
          return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        let processed = 0;
        for (const job of jobs ?? []) {
          if ((job.attempts ?? 0) >= (job.max_attempts ?? 3)) continue;
          await processJob(job as JobRow);
          processed++;
        }

        return new Response(
          JSON.stringify({ ok: true, processed, scanned: jobs?.length ?? 0 }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
