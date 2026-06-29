/**
 * Job abstraction layer.
 *
 * Today: runs the function inline (fire-and-forget after the response).
 * Tomorrow: swap to Inngest / QStash by changing only this file —
 * call sites stay identical.
 *
 * Use this when you want work to happen "out of band" from the request:
 *   - Sending emails (already fire-and-forget today)
 *   - Recomputing trending scores
 *   - Image transcoding or moderation rescans
 *   - Cleanup tasks
 *
 * Do NOT use this for work the user is waiting on (AI generation, etc.).
 * That needs a polling endpoint, which is a separate refactor.
 */

export type JobFn<TArgs> = (args: TArgs) => Promise<unknown>;

export type RunJobOptions = {
  /** Stable name — used for logging now, queue routing later. */
  name: string;
  /** Number of attempts before giving up. Currently best-effort only. */
  retries?: number;
};

/**
 * Schedule a job to run after the current request completes.
 * Failures are logged but never propagate to the caller.
 *
 * NOTE: on Vercel, "after the response" really means "before the lambda
 * freezes". Use Vercel's `waitUntil()` if available; otherwise the work
 * still executes but may extend response latency on cold starts.
 * Inngest/QStash removes this caveat — that's the planned migration.
 */
export function runJob<TArgs>(
  options: RunJobOptions,
  fn: JobFn<TArgs>,
  args: TArgs,
): void {
  const promise = (async () => {
    const attempts = Math.max(1, options.retries ?? 1);
    let lastError: unknown = null;
    for (let i = 1; i <= attempts; i++) {
      try {
        await fn(args);
        return;
      } catch (err) {
        lastError = err;
        console.error(
          `[jobs] ${options.name} attempt ${i}/${attempts} failed:`,
          err,
        );
      }
    }
    console.error(
      `[jobs] ${options.name} gave up after ${attempts} attempt(s):`,
      lastError,
    );
  })();

  // Hook into Vercel's waitUntil if present so the function isn't frozen
  // mid-job. Falls back to fire-and-forget elsewhere.
  const waitUntil = (globalThis as any)?.waitUntil;
  if (typeof waitUntil === "function") {
    try {
      waitUntil(promise);
    } catch {
      void promise;
    }
  } else {
    void promise;
  }
}
