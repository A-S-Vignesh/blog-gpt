import { User } from "@/models/User";

export type CreditSource = "plan" | "extra";

/**
 * Atomically reserve ONE AI generation credit BEFORE any paid model call.
 *
 * Why: the old flow read the usage counter, checked the quota in JS, then wrote
 * later — a read-then-write (TOCTOU) race where two concurrent requests could
 * both pass the check and both consume, letting a user exceed their allowance.
 *
 * This makes the DATABASE enforce the quota:
 *   1. Roll the usage period over once if we've entered a new billing month
 *      (guarded by the period, so only the first concurrent caller resets).
 *   2. Reserve from the monthly plan allowance via a conditional update that
 *      only succeeds while count < limit; if the plan is exhausted, fall back
 *      to purchased extra credits. Each step is a single atomic findOneAndUpdate.
 *
 * The caller MUST refundAiCredit() if the generation ultimately fails, so a
 * failed/blocked model call never costs the user a credit.
 */
export async function reserveAiCredit(
  userId: string,
  monthlyLimit: number,
): Promise<{ ok: boolean; source?: CreditSource }> {
  const now = new Date();
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  // 1. Roll the period over at most once per month. Only matches when the stored
  //    period predates this month (or is unset), so concurrent callers in the
  //    same month don't double-reset.
  await User.updateOne(
    {
      _id: userId,
      $or: [
        { aiUsagePeriodStart: { $lt: monthStart } },
        { aiUsagePeriodStart: { $exists: false } },
        { aiUsagePeriodStart: null },
      ],
    },
    { $set: { aiUsagePeriodStart: now, aiGenerationCount: 0 } },
  );

  // 2a. Reserve from the plan allowance — succeeds only while count < limit.
  const fromPlan = await User.findOneAndUpdate(
    { _id: userId, aiGenerationCount: { $lt: monthlyLimit } },
    { $inc: { aiGenerationCount: 1 } },
  );
  if (fromPlan) return { ok: true, source: "plan" };

  // 2b. Plan exhausted — fall back to purchased extra credits.
  const fromExtra = await User.findOneAndUpdate(
    { _id: userId, aiExtraCredits: { $gt: 0 } },
    { $inc: { aiExtraCredits: -1 } },
  );
  if (fromExtra) return { ok: true, source: "extra" };

  return { ok: false };
}

/** Return a previously reserved credit after a failed/blocked generation. */
export async function refundAiCredit(userId: string, source: CreditSource) {
  await User.updateOne(
    { _id: userId },
    source === "plan"
      ? { $inc: { aiGenerationCount: -1 } }
      : { $inc: { aiExtraCredits: 1 } },
  );
}
