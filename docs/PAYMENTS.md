# Payments

One product: **full access** — **21 days** for **2,000 ֏**, one payment. While it runs its
buyer downloads the designed PDF of **every** CV they have or make, in **any** template, without
limit, and may change templates freely. Not a subscription: nothing renews or charges by
itself. A pass bought while one still runs **adds its 21 days on top**; one bought after it
ended starts 21 days from scratch.

Free, for anyone, always: the same text printed in one fixed black-and-white design
(Classic layout, GHEA Grapalat, no colours, photo or block styles —
`server/src/services/basicCv.ts`). A server CV prints through `GET /cvs/:id/pdf/basic`; a
guest's local draft through the public `POST /pdf/basic`, which takes the document as the
body, prints it and stores nothing (limited per IP, and by the print queue's cap,
`MAX_WAITING` in `services/pdf.ts`). The editor's download dialog offers both.

When the 21 days end **nothing is deleted**: every CV stays, editable and previewable, and the
free PDF still prints. Only what has gone wholly unused for a year is removed (Retention).

Numbers: `server/src/services/pricing.ts` (`PASS_PRICE_AMD`, `PASS_DAYS` — charged and
enforced), `server/src/services/retention.ts` (`RETENTION_DAYS`), and their web twins in
`src/constants/pricing.ts` (printed), pinned equal by `tests/unit/server/twins.spec.ts`. A
change of either is a change of the copy that states it too (hy.json, `src/constants/legal.ts`,
`APP_DESCRIPTION`).

Neither downloading nor buying needs an account.

## The pass

There is no licence table: the owner's `succeeded` `Payment` rows (`userId`, or
`guestKeyHash` for a guest) **are** the passes. `accessWindow` in
`server/src/services/entitlement.ts` (pure, `tests/unit/server/entitlement.spec.ts`) folds them
by `paidAt`: each adds `PASS_DAYS`, from its payment, or — if a pass was still running then —
from that one's end. It answers `until` (when access ends; in the past once it ran out) and
`chain` (the payments the latest window is made of). `Payment.cvId` is only where the buyer
started (the result page leads back to it); nothing is bought per CV.

- `GET /purchases` → `{ accessUntil, payment }` (`payment`: the status of `?payment=<id>` when
  it is the visitor's). Web: `store/purchases`, `hooks/useAccess.ts`.
- `GET /cvs/:id/pdf` asks `runningPass` (`services/payments.ts`): it settles the owner's
  pending payments first, re-checks a running pass's payments for a refund made at the bank
  since (`revalidatePass` — `OrderStatus` 4 / 3, or `RefundedAmount` reaching the charge, turns
  one `refunded` and its days leave the window), and answers 402 `accessRequired` without one.

### Release (migration `20261113000100_access_pass_release`)

Per-CV purchases were moved over: a guest's payments got their `guestKeyHash` from their CV,
`Cv.paidAt` was dropped, and every owner who had paid for a CV got one `grant` payment
(gateway `grant`, amount 0, `paidAt` = the release) — 21 days of full access from the release.
`services/gateways/grant.ts` refuses everything; a grant has no gateway record to check.

## Telling the buyer

The 21 days, and what happens after them, are said wherever money is:

- **Checkout** (`CheckoutModal`): what is included, when the days start and end (`startsNow`,
  or `extendNote` with the new end while access runs), what stays when they end (`afterText`),
  and the one-year rule (`keptText`).
- **Editor**: the top bar's `AccessChip` shows the days left while access runs (accent-coloured
  from 3 days; a click opens the checkout to add days). Download downloads straight away then.
- **Dashboard** (`AccessBanner`): until when and how many days are left, or — once it ran out —
  that every CV is still there and what works without it; the subtitle states what is kept.
  A card's Download is the designed PDF while access runs, else it opens the CV with the
  checkout (`?checkout=1`); the free PDF is always there.
- **Payment result**: until when access runs, and what stays after.
- **Pricing page, FAQ, legal pages, llms.txt, structured data.**

## Flow

1. Editor → **Download** without running access (or the chip, or `?checkout=1`) →
   `CheckoutModal`. Pay → the CV is saved (a guest's draft becomes a server CV first) →
   `POST /purchases/checkout { cvId, client }` → `startCheckout` writes a `pending` `Payment`
   for the owner and returns the gateway's page URL.
2. The buyer pays on the bank's page; the bank redirects to `GET /payments/return/<gateway>`.
3. That route stamps `returnedAt`, calls `settlePayment` — which asks the gateway **server to
   server** and moves the row `pending → succeeded|failed` by compare-and-set, setting
   `paidAt`, where the days start — and redirects to `/payment/result?status=…&payment=…&cv=…`.
   That page re-reads the payment through `GET /purchases?payment=` (polling while the bank is
   still pending) and offers the CV's designed PDF.

A buyer who closes the tab before step 2 is covered by **reconcile-on-read**: `GET /purchases`,
every designed print and every new checkout re-check the owner's pending payments from the last
3 days. `Payment` rows outlive their CV and user (`SetNull`) — they are the accounting record.

Back from the bank with nothing charged (Back, the 20-minute limit, the bank page's own error
`0999`): the record is still `OrderStatus` 0 / 5, so the result shows "not paid, nothing
charged" unless the redirect's own `resposneCode` is `00`; the row stays `pending`, so a
payment made after all still counts the next time access is read.

### Paying twice by mistake

A second payment is not an error — its days go on top — but nobody should pay twice without
meaning to:

1. **An earlier payment whose redirect was lost** is found before a new checkout: if
   reconciling settles one, `POST /purchases/checkout` answers 409 `earlierPaymentSucceeded`
   and the editor says "your earlier payment went through, access until …" and downloads.
2. **A bank page that may still be open in another tab** (`findOpenPayment`: pending, younger
   than the page timeout plus 2 minutes for clock drift — `PAYMENT_PAGE_TIMEOUT_SECONDS` is
   Ameria's `Timeout` — and never returned from, `Payment.returnedAt`): checkout answers
   `{ openPayment: { minutesAgo } }`; `useCheckout` offers to continue it and resends with
   `resume`, which sends the buyer to **that order's own bank page** (`resumeOpenPayment`,
   the gateway's `pageUrl`), so one order is charged once, whichever tab pays. Once only
   (`Payment.reopenedAt`): back again without the bank sending them, that page may not reopen,
   so the next click starts a new order — never a loop. Minutes and the window are this
   server's clock only.

## Admin mails

Two internal mails reach the admin inbox through the mail engine's internal endpoint
(`server/src/services/paymentNotifications.ts`, built in `paymentMail.ts`):

- **Checkout started** — sent by `startCheckout` once the gateway answered, so it carries the
  order # (or says the bank page failed to open).
- **Payment succeeded** — sent by `settlePayment` only when it wins the `pending → succeeded`
  claim, so once per payment whether the bank redirect or reconcile-on-read settled it; it
  says which, and until when the buyer's full access now runs.

Both list the payment, the buyer (account or guest, earlier purchases), the CV they started
from (title, template, the name and contacts on it) and the device: IP, user agent with a
readable summary, client hints, languages, and the browser's own facts the checkout sends
(`src/helpers/clientInfo.ts` → `asClientInfo` in `server/src/lib/request-info.ts`; the keys
are pinned by `twins.spec.ts`). The success mail's device is the request that confirmed it;
the two mails share the order #. Best effort: never awaited, failures only logged, "started"
capped at 30 an hour (the engine's 10-a-minute budget is shared with sign-up mail). Sent
only when `NODE_ENV=production`; anywhere else they print to the API's console, even with
`MAIL_API_*` set, so local test purchases never reach the admin inbox.

## Without an account

A guest who pays is warned first, in the dialog (`GuestWarning` in `CheckoutModal`): the CVs
and the access will belong to this browser only — not other devices, and gone if its cookies
are cleared — unless they sign in, which the warning also offers. Going ahead:

1. `POST /cvs` without a session turns the local draft into a server CV owned by the
   browser's **guest key** (`server/src/lib/guest.ts`): a random secret in the httpOnly
   `cv-builder-guest` cookie (400 days, renewed on use), stored only as a hash. A CV has
   exactly one owner, account or guest key (a CHECK constraint).
2. `POST /purchases/checkout` without a session mints the guest key if needed; it owns the
   payment (`Payment.guestKeyHash`), so the access is this browser's.
3. Signing in — password (after a sign-up's verification link, which only activates), Google,
   or simply `GET /identity/me` with both cookies — moves the guest's CVs **and payments** to
   the account and clears the cookie (`server/src/services/guestCvs.ts`); the account's window
   is then folded from all of them.

## Retention

`server/src/services/retention.ts` (the policy, pure, `tests/unit/server/entitlement.spec.ts`)
and `retentionSweep.ts` (the sweep, once a day in the API process, first 10 minutes after
start). Deleted only when **all three** are older than a year (`RETENTION_DAYS`):

- the last use — an account's session (`User.lastActiveAt`, stamped by `middleware/auth.ts` at
  most once a day); a guest's CV's last change (`Cv.updatedAt`);
- the last download of a PDF of it, free or designed (`PdfDownload`, both variants recorded);
- the end of the owner's access (`accessWindow`) — a pass that ran inside the year keeps it.

An account goes with its CVs (cascade); a guest's CVs one by one. `Payment` and `PdfDownload`
rows stay (their links `SET NULL`): the accounting record. A browser's local draft is the
browser's; the server never sees it.

## Gateways (`server/src/services/gateways/`)

A gateway implements `init`, `pageUrl`, `check`, `confirm`, `refund`, `cancel` and `isReversed`
(`types.ts`); `PAYMENT_GATEWAY` picks one (`ameria` or `mock`; `grant` is the release's, not a
gateway a buyer uses).

### `mock` (development)

A page served by the API with Pay / Decline buttons; state in memory. Refused in production
(`isPaymentConfigured`).

### `ameria` — Ameriabank vPOS 3.1

Wire format and the settlement rule: `ameria-wire.ts` (pure, tested in
`tests/unit/server/ameria.spec.ts`). The client: `ameria.ts`, the only reader of the
credentials.

Going live:

1. Apply for vPOS through Ameriabank's business platform; credentials and the test
   environment come from vpos.support@ameriabank.am. The bank requires the Terms, Privacy and
   Refund pages to be reachable on the site (`/terms`, `/privacy`, `/refund-policy` — **their
   text is a draft; have it reviewed**).
2. Test mode (`AMERIA_TEST_MODE=true`, base `servicestest.ameriabank.am`): the test terminal
   accepts only **10 AMD** and an **OrderID inside the range the bank assigns**. Set
   `AMERIA_AMOUNT_OVERRIDE=10` and `AMERIA_ORDER_ID_OFFSET` to the start of the range (the
   OrderID sent is offset + `Payment.orderNumber`). The bank signs off after several
   successful test payments.
3. Production: `AMERIA_TEST_MODE=false`, remove `AMERIA_AMOUNT_OVERRIDE`, set the offset so
   live OrderIDs never collide with test ones, `PAYMENT_GATEWAY=ameria`, and
   `API_PUBLIC_URL` to the public API origin (the BackURL is built on it).

What is verified on return: `ResponseCode "00"`, `OrderStatus 2` / `payment_deposited`, the
OrderID equals ours and the charged amount is at least ours. Declined, void and refunded are
`failed`; anything else stays `pending`. A return whose record is still `OrderStatus` 0 / 5
(nothing charged — the buyer pressed Back or gave up on the bank's page) shows the buyer
"not paid" rather than "processing", unless the redirect's own `resposneCode` is `00`; the
row stays `pending`, so a payment made after all still counts the next time access is read.

A two-stage terminal answers `OrderStatus 1` / `payment_approved` instead: the amount is
only blocked. After the same OrderID and (blocked) amount checks, `settlePayment` calls the
gateway's `confirm`, which sends `ConfirmPayment` for our amount and reads `GetPaymentDetails` again; only that second read
can settle it. Whether the terminal is one- or two-stage is the bank's setting.

Money goes back by an operator, in the bank's merchant panel — **the live setup**: there is
no API reversal permission, so `AMERIA_API_REVERSALS` is unset. A refund made there is read
back before the owner's next designed print (`revalidatePass`), which takes its days back. With the
permission and `AMERIA_API_REVERSALS=true`, also
`pnpm payments:reverse <refund|cancel> <order number>…` (`server/src/cli/reverse-payment.ts`,
order numbers are `Payment.orderNumber`; on the server `node dist/src/cli/reverse-payment.js`
with the API's env). That calls `RefundPayment` (the whole charge) or
`CancelPayment` (only within 72 hours of InitPayment) — the bank's refund/reverse permission,
codes 513/514 — then marks the payment `refunded`, and its days leave the window. Re-running it is safe:
the bank refuses a second reversal, and one that took effect despite an unclear answer is
read back from `GetPaymentDetails`. Each payment is reversed at most once, so the bank's
sign-off ("5 refunds and 5 cancellations") needs 10 settled test payments.

## Delivery evidence

The refund policy (`src/constants/legal.ts#REFUND`) refunds a PDF that could not be
downloaded — but not one that was. Every designed PDF the server sends in full writes a
`PdfDownload` row (`GET /cvs/:id/pdf`, `routes/cvs.ts`): the time, the size, the IP and user
agent, and the payment it was served under (the latest of the running window). It is
written on the response's `finish` — the last byte handed to the connection — so a print
that failed, or a client that hung up first, leaves no row. That is as close as the server
can get to "received": it cannot see the browser save the file. The free black-and-white
PDF is recorded too (`variant: basic`, no payment) — a sign of use for retention.

Rows outlive the CV and the account (both links `SET NULL`), like the payment itself. To
check a claim, find the payment by the buyer's email and date, then:

```sql
SELECT d."createdAt", d.bytes, d.ip, d."userAgent"
FROM "PdfDownload" d JOIN "Payment" p ON p.id = d."paymentId"
WHERE p."orderNumber" = <order number>
ORDER BY d."createdAt";
```

No rows: the PDF never reached them. Rows from their usual IP and browser after the
payment: it did.
