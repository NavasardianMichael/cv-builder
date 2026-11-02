# Payments

One product: unlocking **one CV** for **2,000 ֏**, once. A paid CV can be edited and
downloaded forever, as designed; a duplicate is a new, unpaid CV.

Free, for anyone and any CV: the same text printed in one fixed black-and-white design
(Classic layout, GHEA Grapalat, no colours, photo or block styles —
`server/src/services/basicCv.ts`). A server CV prints through `GET /cvs/:id/pdf/basic`; a
guest's local draft through the public `POST /pdf/basic`, which takes the document as the
body, prints it and stores nothing (limited per IP, and by the print queue's cap,
`MAX_WAITING` in `services/pdf.ts`). The editor's download dialog offers both. Price:
`server/src/services/pricing.ts` (charged) and `src/constants/pricing.ts` (printed), pinned
equal by a test.

Neither downloading nor buying needs an account.

## Flow

1. Editor → **Download** → `CheckoutModal` → `POST /cvs/:id/checkout`.
2. `startCheckout` writes a `pending` `Payment`, calls the gateway's `init`, returns its page URL.
3. The buyer pays on the bank's page; the bank redirects to `GET /payments/return/<gateway>`.
4. That route calls `settlePayment`, which asks the gateway **server to server** and moves the
   row `pending → succeeded|failed` by compare-and-set, setting `Cv.paidAt` in the same
   transaction. Then it redirects to the web's `/payment/result?status=…&cv=…`.
5. `GET /cvs/:id/pdf` (the designed PDF) answers 402 until `paidAt` is set — and again after
   a refund (below).

A buyer who closes the tab before step 3 is covered by **reconcile-on-read**: `GET /cvs/:id`
and `GET /cvs/:id/pdf` re-check that CV's pending payments from the last 3 days.
`Payment` rows outlive their CV and user (`SetNull`) — they are the accounting record.

## Without an account

A guest who pays is warned first, in the dialog (`GuestWarning` in `CheckoutModal`): the CV
will live only in this browser — not on other devices, and gone if its cookies are cleared —
unless they sign in, which the warning also offers. Going ahead:

1. `POST /cvs` without a session turns the local draft into a server CV owned by the
   browser's **guest key** (`server/src/lib/guest.ts`): a random secret in the httpOnly
   `cv-builder-guest` cookie (400 days, renewed on use), stored only as `Cv.guestKeyHash`. A CV
   has exactly one owner, account or guest key (a CHECK constraint). The editor carries on
   with the new id in place, and the local draft is cleared.
2. Checkout, the bank and the result page are the normal flow; every `/cvs` route accepts
   the guest key in place of a session (`requireCvOwner`), so the guest can edit and download
   what they bought, and find it on `/dashboard` (the proxy lets a guest cookie through).
3. Signing in — password (after a sign-up's verification link, which only activates), Google, or simply `GET /identity/me` with both cookies —
   moves the guest's CVs and their payments to the account and clears the cookie
   (`server/src/services/guestCvs.ts`).

Unpaid guest CVs (a checkout abandoned at the bank) are not cleaned up yet.

## Gateways (`server/src/services/gateways/`)

A gateway implements `init` and `check` (`types.ts`); `PAYMENT_GATEWAY` picks one.

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
`failed`; anything else stays `pending`.

A two-stage terminal answers `OrderStatus 1` / `payment_approved` instead: the amount is
only blocked. After the same OrderID and (blocked) amount checks, `check` sends
`ConfirmPayment` for our amount and reads `GetPaymentDetails` again; only that second read
can settle it. Whether the terminal is one- or two-stage is the bank's setting.

Refunds are made by hand in the bank's merchant panel. `RefundPayment` (up to the
transaction amount) and `CancelPayment` (within 72 hours of InitPayment) exist in the
protocol and need the bank's refund/reverse permission (codes 513/514); they are not called.

A refund takes the designed PDF back: before printing it, `GET /cvs/:id/pdf` re-reads the
CV's `succeeded` payments (`revalidatePaidCv`). One the bank shows refunded or voided —
`OrderStatus` 4 / 3, or `RefundedAmount` reaching the charge; a partial refund does not
count — becomes `refunded`, and the CV loses `paidAt` when no `succeeded` payment is left,
so its owner gets 402 and may buy it again. A bank that cannot answer counts as still paid.
Until that first download attempt the dashboard still shows the CV as paid.

## Delivery evidence

The refund policy (`src/constants/legal.ts#REFUND`) refunds a PDF that could not be
downloaded — but not one that was. Every designed PDF the server sends in full writes a
`PdfDownload` row (`GET /cvs/:id/pdf`, `routes/cvs.ts`): the time, the size, the IP and user
agent, and the `succeeded` payment it was served under (the latest, if there are two). It is
written on the response's `finish` — the last byte handed to the connection — so a print
that failed, or a client that hung up first, leaves no row. That is as close as the server
can get to "received": it cannot see the browser save the file. The free black-and-white
PDF is not recorded.

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
