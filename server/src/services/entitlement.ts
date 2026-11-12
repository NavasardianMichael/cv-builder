/**
 * The access pass (docs/PAYMENTS.md): what one payment buys is **time** — `PASS_DAYS` days of
 * every template's designed PDF for every CV of its owner (account, or guest browser). The
 * owner's succeeded payments are the passes; nothing else records them. The free black-and-
 * white PDF needs none. Import-free, so a unit test can hold it.
 */

const DAY_MS = 24 * 60 * 60 * 1000

export type PaidPass = { id: string; paidAt: Date }

/**
 * Pure: the owner's access, from their succeeded payments. Each adds `days`, starting when it
 * was paid or, if a pass was still running then, when that one ends — so a pass bought early
 * is never lost. `until` is when the last window ends (in the past once it has run out; null
 * with no payment). `chain` is the payments the latest window is made of, oldest first: the
 * ones a refund could still shorten, and the last of them is what a download counts against.
 */
export const accessWindow = (payments: readonly PaidPass[], days: number): { until: Date | null; chain: PaidPass[] } => {
  const sorted = [...payments].sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime())
  let until: number | null = null
  let chain: PaidPass[] = []
  for (const payment of sorted) {
    const paid = payment.paidAt.getTime()
    if (until === null || paid >= until) {
      chain = [payment]
      until = paid + days * DAY_MS
    } else {
      chain.push(payment)
      until += days * DAY_MS
    }
  }
  return { until: until === null ? null : new Date(until), chain }
}
