-- Online payments via NOWPayments. A provider-confirmed payment may be verified without a human admin,
-- but it must still carry the provider payment id, the exact amount and a timestamp.
alter table public.case_payments
  add column if not exists provider text,
  add column if not exists provider_ref text,          -- NOWPayments invoice id
  add column if not exists provider_price numeric,     -- price we asked for in provider_currency
  add column if not exists provider_currency text;

alter table public.case_payments drop constraint if exists case_payment_verified_has_evidence;
alter table public.case_payments add constraint case_payment_verified_has_evidence check (
  status not in ('verified', 'refunded') or (
    bank_reference is not null and received_amount_pkr is not null and verified_at is not null
    and (verified_by is not null or bank_reference like 'nowpayments:%')));
